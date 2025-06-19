import socket
import threading

HOST = '0.0.0.0'  # Lắng nghe trên mọi địa chỉ
PORT = 5001      # Cổng server TCP

clients = []  # Lưu kết nối client

# Hàm xử lý từng client
def handle_client(conn, addr):
    print(f'Kết nối từ: {addr}')
    clients.append(conn)
    try:
        while True:
            # Nhận dữ liệu từ client 1 (bên upload & ký)
            data = conn.recv(4096)
            if not data:
                break
            print(f'Nhận {len(data)} bytes từ {addr}')
            # Chuyển tiếp cho client còn lại (bên xác minh)
            for c in clients:
                if c != conn:
                    try:
                        c.sendall(data)
                    except:
                        pass
    except Exception as e:
        print(f'Lỗi: {e}')
    finally:
        print(f'Đóng kết nối: {addr}')
        clients.remove(conn)
        conn.close()

def main():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        s.bind((HOST, PORT))
        s.listen(2)
        print(f'Server TCP lắng nghe tại {HOST}:{PORT}')
        while True:
            conn, addr = s.accept()
            threading.Thread(target=handle_client, args=(conn, addr), daemon=True).start()

if __name__ == '__main__':
    main() 