# RSA File Transfer qua TCP Socket

## Mô tả
Đây là hệ thống truyền file có ký số sử dụng giao thức TCP socket, gồm 3 thành phần:
- **Server TCP trung gian**: Chuyển tiếp file và chữ ký giữa người gửi và người nhận.
- **Client Upload & Ký số**: Giao diện web cho phép upload file, ký số bằng private key, gửi file + chữ ký qua server.
- **Client Verify (Xác minh)**: Giao diện web cho phép nhận file, xác minh chữ ký bằng public key của người gửi.

## Cấu trúc thư mục
```
├── client_upload_sign.py      # Flask app phía gửi/ký số
├── client_verify.py           # Flask app phía nhận/xác minh
├── tcp_server.py              # Server TCP trung gian
├── rsa_manager.py             # Quản lý RSA, ký số, xác minh
├── templates/                 # Giao diện HTML (Bootstrap)
│   ├── upload_sign.html
│   └── verify_signature.html
├── uploads/                   # Nơi lưu file nhận/gửi
├── keys/                      # Nơi lưu cặp khóa của người gửi
├── requirements.txt           # Thư viện Python cần thiết
```

## Cài đặt
1. **Tạo môi trường ảo (tuỳ chọn):**
   ```bash
   python -m venv venv
   source venv/bin/activate  # hoặc venv\Scripts\activate trên Windows
   ```
2. **Cài đặt thư viện:**
   ```bash
   pip install -r requirements.txt
   ```

## Hướng dẫn chạy hệ thống
### 1. Chạy server TCP trung gian
```bash
python tcp_server.py
```

### 2. Chạy client upload & ký số (người gửi)
```bash
python client_upload_sign.py
```
Truy cập [http://localhost:8001](http://localhost:8001)

### 3. Chạy client verify (người nhận)
```bash
python client_verify.py
```
Truy cập [http://localhost:8002](http://localhost:8002)

## Quy trình sử dụng
1. **Người gửi:**
   - Vào trang upload, chọn file, nhập private key (hoặc để hệ thống tự sinh), nhấn "Upload & Ký số".
   - Có thể tải xuống/copy public key để gửi cho người nhận.
2. **Người nhận:**
   - Khi nhận file và chữ ký, vào trang xác minh, chọn file, dán chữ ký và public key (hoặc hệ thống tự điền nếu đã nhận được).
   - Nhấn "Xác minh chữ ký" để kiểm tra tính hợp lệ.

## Lưu ý về khóa
- **Private key**: Luôn giữ bí mật, không chia sẻ.
- **Public key**: Chia sẻ cho người nhận để xác minh chữ ký.
- Hệ thống sẽ tự động sinh cặp khóa nếu chưa có.

## Credit
- Sử dụng Flask, cryptography, Bootstrap.
- Tác giả: #Hwungg🥀

## Một số hình ảnh giao diện

### Upload & ký số
![image](https://github.com/user-attachments/assets/6d4b96d2-6b50-4515-a6ed-954014175cc4)

### Xác minh chữ ký
![image](https://github.com/user-attachments/assets/ff8dab9d-958f-492a-a7c9-8d834a64452b)


