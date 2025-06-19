import os
import hashlib
import base64
from datetime import datetime
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives.serialization import load_pem_private_key, load_pem_public_key
import json

class RSAManager:
    """Class quản lý việc tạo khóa, ký số và xác minh chữ ký RSA"""
    
    def __init__(self, keys_folder='keys', key_size=2048):
        """
        Khởi tạo RSA Manager
        
        Args:
            keys_folder (str): Thư mục chứa file khóa
            key_size (int): Kích thước khóa RSA (mặc định 2048)
        """
        self.keys_folder = keys_folder
        self.key_size = key_size
        self.private_key = None
        self.public_key = None
        self.private_key_path = os.path.join(keys_folder, 'private_key.pem')
        self.public_key_path = os.path.join(keys_folder, 'public_key.pem')
    
    def generate_key_pair(self):
        """
        Tạo cặp khóa RSA mới
        
        Returns:
            tuple: (private_key_pem, public_key_pem) dưới dạng string
        """
        try:
            # Tạo khóa riêng
            private_key = rsa.generate_private_key(
                public_exponent=65537,
                key_size=self.key_size,
            )
            public_key = private_key.public_key()
            
            # Chuyển đổi thành format PEM
            private_pem = private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            )
            
            public_pem = public_key.public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo
            )
            
            # Lưu khóa vào file
            with open(self.private_key_path, 'wb') as f:
                f.write(private_pem)
            
            with open(self.public_key_path, 'wb') as f:
                f.write(public_pem)
            
            # Lưu vào memory
            self.private_key = private_key
            self.public_key = public_key
            
            return private_pem.decode(), public_pem.decode()
            
        except Exception as e:
            raise Exception(f"Lỗi tạo cặp khóa: {str(e)}")
    
    def load_keys(self):
        """
        Tải khóa từ file
        
        Returns:
            bool: True nếu tải thành công, False nếu không
        """
        try:
            # Kiểm tra file có tồn tại không
            if not os.path.exists(self.private_key_path) or not os.path.exists(self.public_key_path):
                return False
            
            # Tải khóa riêng
            with open(self.private_key_path, 'rb') as f:
                self.private_key = load_pem_private_key(f.read(), password=None)
            
            # Tải khóa công khai
            with open(self.public_key_path, 'rb') as f:
                self.public_key = load_pem_public_key(f.read())
            
            return True
            
        except Exception as e:
            print(f"Lỗi tải khóa: {str(e)}")
            return False
    
    def get_public_key_pem(self):
        """
        Lấy khóa công khai dưới dạng PEM string
        
        Returns:
            str: Khóa công khai PEM hoặc None
        """
        try:
            if self.public_key:
                public_pem = self.public_key.public_bytes(
                    encoding=serialization.Encoding.PEM,
                    format=serialization.PublicFormat.SubjectPublicKeyInfo
                )
                return public_pem.decode()
            return None
        except:
            return None
    
    def get_private_key_pem(self):
        """
        Lấy khóa riêng dưới dạng PEM string
        
        Returns:
            str: Khóa riêng PEM hoặc None
        """
        try:
            if self.private_key:
                private_pem = self.private_key.private_bytes(
                    encoding=serialization.Encoding.PEM,
                    format=serialization.PrivateFormat.PKCS8,
                    encryption_algorithm=serialization.NoEncryption()
                )
                return private_pem.decode()
            return None
        except:
            return None
    
    def sign_file(self, file_path):
        """
        Ký số một file
        
        Args:
            file_path (str): Đường dẫn đến file cần ký
            
        Returns:
            str: Chữ ký số dưới dạng base64
        """
        if not self.private_key:
            raise Exception("Không có khóa riêng để ký")
        
        if not os.path.exists(file_path):
            raise Exception("File không tồn tại")
        
        try:
            # Đọc file và tính hash
            with open(file_path, 'rb') as f:
                file_data = f.read()
                file_hash = hashlib.sha256(file_data).digest()
            
            # Ký hash bằng khóa riêng
            signature = self.private_key.sign(
                file_hash,
                padding.PSS(
                    mgf=padding.MGF1(hashes.SHA256()),
                    salt_length=padding.PSS.MAX_LENGTH
                ),
                hashes.SHA256()
            )
            
            # Chuyển đổi thành base64
            return base64.b64encode(signature).decode()
            
        except Exception as e:
            raise Exception(f"Lỗi ký file: {str(e)}")
    
    def verify_signature(self, file_path, signature_b64, public_key_pem=None):
        """
        Xác minh chữ ký số của file
        
        Args:
            file_path (str): Đường dẫn đến file cần xác minh
            signature_b64 (str): Chữ ký số dưới dạng base64
            public_key_pem (str, optional): Khóa công khai PEM. Nếu None thì dùng khóa hiện tại
            
        Returns:
            bool: True nếu chữ ký hợp lệ, False nếu không
        """
        try:
            # Chọn khóa công khai
            if public_key_pem:
                public_key = load_pem_public_key(public_key_pem.encode())
            else:
                public_key = self.public_key
            
            if not public_key:
                raise Exception("Không có khóa công khai")
            
            if not os.path.exists(file_path):
                raise Exception("File không tồn tại")
            
            # Đọc file và tính hash
            with open(file_path, 'rb') as f:
                file_data = f.read()
                file_hash = hashlib.sha256(file_data).digest()
            
            # Giải mã chữ ký từ base64
            signature = base64.b64decode(signature_b64)
            
            # Xác minh chữ ký
            public_key.verify(
                signature,
                file_hash,
                padding.PSS(
                    mgf=padding.MGF1(hashes.SHA256()),
                    salt_length=padding.PSS.MAX_LENGTH
                ),
                hashes.SHA256()
            )
            
            return True
            
        except Exception as e:
            print(f"Lỗi xác minh: {str(e)}")
            return False
    
    def save_signature_info(self, filename, signature, upload_folder='uploads'):
        """
        Lưu thông tin chữ ký vào file .sig
        
        Args:
            filename (str): Tên file gốc
            signature (str): Chữ ký số
            upload_folder (str): Thư mục upload
        """
        try:
            signature_info = {
                'filename': filename,
                'signature': signature,
                'timestamp': datetime.now().isoformat(),
                'algorithm': 'RSA-PSS',
                'hash_function': 'SHA-256',
                'key_size': self.key_size
            }
            
            sig_file_path = os.path.join(upload_folder, filename + '.sig')
            with open(sig_file_path, 'w', encoding='utf-8') as f:
                json.dump(signature_info, f, indent=2, ensure_ascii=False)
                
        except Exception as e:
            print(f"Lỗi lưu thông tin chữ ký: {str(e)}")
    
    def load_signature_info(self, filename, upload_folder='uploads'):
        """
        Tải thông tin chữ ký từ file .sig
        
        Args:
            filename (str): Tên file gốc
            upload_folder (str): Thư mục upload
            
        Returns:
            dict: Thông tin chữ ký hoặc None
        """
        try:
            sig_file_path = os.path.join(upload_folder, filename + '.sig')
            if os.path.exists(sig_file_path):
                with open(sig_file_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            return None
        except Exception as e:
            print(f"Lỗi tải thông tin chữ ký: {str(e)}")
            return None
    
    def has_keys(self):
        """
        Kiểm tra xem có khóa trong memory không
        
        Returns:
            bool: True nếu có khóa, False nếu không
        """
        return self.private_key is not None and self.public_key is not None