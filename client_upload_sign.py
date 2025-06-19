import os
import socket
from flask import Flask, render_template, request, send_file
from werkzeug.utils import secure_filename
from rsa_manager import RSAManager
from cryptography.hazmat.primitives.serialization import load_pem_private_key
from cryptography.hazmat.backends import default_backend

UPLOAD_FOLDER = 'uploads'
TCP_SERVER_HOST = '127.0.0.1'
TCP_SERVER_PORT = 5001
KEYS_FOLDER = 'keys'

app = Flask(__name__)
app.secret_key = 'rsa_upload_secret'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def send_to_tcp_server(file_path, signature):
    with open(file_path, 'rb') as f:
        file_data = f.read()
    file_name = os.path.basename(file_path).encode()
    file_name_len = len(file_name).to_bytes(2, 'big')
    file_size = len(file_data).to_bytes(8, 'big')
    sig = signature.encode()
    sig_len = len(sig).to_bytes(4, 'big')
    payload = file_name_len + file_name + file_size + file_data + sig_len + sig
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.connect((TCP_SERVER_HOST, TCP_SERVER_PORT))
        s.sendall(payload)

@app.route('/public_key')
def download_public_key():
    rsa = RSAManager(KEYS_FOLDER)
    if not rsa.load_keys():
        rsa.generate_key_pair()
    pubkey_path = os.path.join(KEYS_FOLDER, 'public_key.pem')
    return send_file(pubkey_path, as_attachment=True)

@app.route('/', methods=['GET', 'POST'])
def upload_sign():
    message = None
    rsa = RSAManager(KEYS_FOLDER)
    if not rsa.load_keys():
        rsa.generate_key_pair()
    public_key_pem = rsa.get_public_key_pem()
    if request.method == 'POST':
        file = request.files.get('file')
        private_key_pem = request.form.get('private_key')
        if not file or not private_key_pem:
            message = 'Vui lòng chọn file và nhập private key.'
        else:
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            try:
                rsa.private_key = load_pem_private_key(private_key_pem.encode(), password=None, backend=default_backend())
                signature = rsa.sign_file(file_path)
                send_to_tcp_server(file_path, signature)
                message = 'Đã ký số và gửi file thành công!'
            except Exception as e:
                message = f'Lỗi: {e}'
    return render_template('upload_sign.html', message=message, public_key=public_key_pem)

if __name__ == '__main__':
    app.run(port=8001, debug=True)