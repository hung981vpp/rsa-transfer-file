import os
import socket
import threading
from flask import Flask, render_template, request
from werkzeug.utils import secure_filename
from rsa_manager import RSAManager

UPLOAD_FOLDER = 'uploads'
TCP_SERVER_HOST = '127.0.0.1'
TCP_SERVER_PORT = 5001

app = Flask(__name__)
app.secret_key = 'rsa_verify_secret'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def receive_from_tcp_server():
    while True:
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.connect((TCP_SERVER_HOST, TCP_SERVER_PORT))
                while True:
                    # Nhận header file name
                    file_name_len = int.from_bytes(s.recv(2), 'big')
                    file_name = s.recv(file_name_len).decode()
                    file_size = int.from_bytes(s.recv(8), 'big')
                    file_data = b''
                    while len(file_data) < file_size:
                        chunk = s.recv(min(4096, file_size - len(file_data)))
                        if not chunk:
                            break
                        file_data += chunk
                    sig_len = int.from_bytes(s.recv(4), 'big')
                    signature = s.recv(sig_len).decode()
                    # Lưu file và chữ ký
                    file_path = os.path.join(UPLOAD_FOLDER, file_name)
                    with open(file_path, 'wb') as f:
                        f.write(file_data)
                    sig_path = os.path.join(UPLOAD_FOLDER, file_name + '.sig.txt')
                    with open(sig_path, 'w', encoding='utf-8') as f:
                        f.write(signature)
                    print(f'Đã nhận file: {file_name} và chữ ký')
        except Exception as e:
            print(f'Lỗi nhận từ server: {e}')
            import time
            time.sleep(2)

def start_receiver_thread():
    t = threading.Thread(target=receive_from_tcp_server, daemon=True)
    t.start()

@app.route('/', methods=['GET', 'POST'])
def verify_signature():
    message = None
    public_key_pem = None
    public_key_path = os.path.join(app.config['UPLOAD_FOLDER'], 'public_key.pem')
    if os.path.exists(public_key_path):
        with open(public_key_path, 'r', encoding='utf-8') as f:
            public_key_pem = f.read()
    if request.method == 'POST':
        file = request.files.get('file')
        signature = request.form.get('signature')
        public_key = request.form.get('public_key')
        if not file or not signature or not public_key:
            message = 'Vui lòng chọn file, nhập chữ ký và public key.'
        else:
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            try:
                rsa = RSAManager()
                is_valid = rsa.verify_signature(file_path, signature, public_key)
                if is_valid:
                    message = 'Chữ ký hợp lệ!'
                else:
                    message = 'Chữ ký không hợp lệ!'
            except Exception as e:
                message = f'Lỗi: {e}'
    return render_template('verify_signature.html', message=message, public_key=public_key_pem)

if __name__ == '__main__':
    start_receiver_thread()
    app.run(port=8002, debug=True) 