// JavaScript chính cho ứng dụng RSA File Transfer

// Biến global
let currentSignature = '';
let currentFileName = '';
let currentOriginalFileName = '';

// Khởi tạo khi trang load
document.addEventListener('DOMContentLoaded', function() {
    // Tải danh sách file
    loadFileList();
    
    // Thêm event listeners
    setupEventListeners();
    
    // Kiểm tra trạng thái khóa
    checkKeyStatus();
});

// Thiết lập event listeners
function setupEventListeners() {
    // Form upload file
    const uploadForm = document.getElementById('uploadForm');
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleFileUpload);
    }
    
    // Form xác minh chữ ký
    const verifyForm = document.getElementById('verifyForm');
    if (verifyForm) {
        verifyForm.addEventListener('submit', handleVerifySignature);
    }
    
    // File input change event
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            validateFileSize(this);
        });
    }
    
    // Nút tạo khóa mới
    const generateKeysBtn = document.getElementById('generateKeysBtn');
    if (generateKeysBtn) {
        generateKeysBtn.addEventListener('click', generateKeys);
    }
    
    // Nút tải khóa
    const loadKeysBtn = document.getElementById('loadKeysBtn');
    if (loadKeysBtn) {
        loadKeysBtn.addEventListener('click', loadKeys);
    }
    
    // Nút toggle hiển thị khóa
    const toggleKeyBtn = document.getElementById('toggleKeyBtn');
    if (toggleKeyBtn) {
        toggleKeyBtn.addEventListener('click', toggleKeyDisplay);
    }
    
    // Các nút copy
    setupCopyButtons();
}

// Thiết lập các nút copy
function setupCopyButtons() {
    const copyButtons = document.querySelectorAll('[data-copy-target]');
    copyButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-copy-target');
            copyToClipboard(targetId);
        });
    });
}

// Hiển thị thông báo
function showAlert(message, type = 'info', duration = 5000) {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) return;
    
    const alertId = 'alert_' + Date.now();
    const alertHtml = `
        <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show" role="alert">
            <i class="fas ${getAlertIcon(type)}"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    alertContainer.insertAdjacentHTML('beforeend', alertHtml);
    
    // Tự động ẩn sau duration
    setTimeout(() => {
        const alertElement = document.getElementById(alertId);
        if (alertElement) {
            const bsAlert = new bootstrap.Alert(alertElement);
            bsAlert.close();
        }
    }, duration);
}

// Lấy icon cho alert
function getAlertIcon(type) {
    const icons = {
        'success': 'fa-check-circle',
        'danger': 'fa-exclamation-triangle',
        'warning': 'fa-exclamation-circle',
        'info': 'fa-info-circle'
    };
    return icons[type] || 'fa-info-circle';
}

// Format datetime
function formatDateTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Tạo cặp khóa mới
async function generateKeys() {
    try {
        showAlert('Đang tạo cặp khóa RSA...', 'info');
        
        const response = await fetch('/generate_keys', { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('publicKey').textContent = data.public_key;
            document.getElementById('privateKey').textContent = data.private_key;
            updateKeyStatus(true);
            showAlert(data.message, 'success');
        } else {
            showAlert('Lỗi: ' + data.error, 'danger');
        }
    } catch (error) {
        showAlert('Lỗi kết nối: ' + error.message, 'danger');
    }
}

// Tải khóa hiện có
async function loadKeys() {
    try {
        showAlert('Đang tải khóa từ file...', 'info');
        
        const response = await fetch('/load_keys', { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            if (data.public_key && data.private_key) {
                document.getElementById('publicKey').textContent = data.public_key;
                document.getElementById('privateKey').textContent = data.private_key;
            }
            updateKeyStatus(true);
            showAlert(data.message, 'success');
        } else {
            showAlert('Lỗi: ' + data.error, 'warning');
            updateKeyStatus(false);
        }
    } catch (error) {
        showAlert('Lỗi kết nối: ' + error.message, 'danger');
        updateKeyStatus(false);
    }
}

// Cập nhật trạng thái khóa
function updateKeyStatus(hasKeys) {
    const keyStatus = document.getElementById('keyStatus');
    const keyStatusText = document.getElementById('keyStatusText');
    const statusIcon = document.querySelector('.key-status i');
    const uploadForm = document.getElementById('uploadForm');
    
    if (hasKeys) {
        if (keyStatus) keyStatus.textContent = 'Khóa sẵn sàng';
        if (keyStatus) keyStatus.className = 'badge bg-success';
        if (keyStatusText) keyStatusText.textContent = 'Khóa sẵn sàng';
        if (statusIcon) {
            statusIcon.className = 'fas fa-circle text-success';
        }
        if (uploadForm) {
            uploadForm.classList.remove('disabled');
            uploadForm.querySelector('button[type="submit"]').disabled = false;
        }
    } else {
        if (keyStatus) keyStatus.textContent = 'Chưa có khóa';
        if (keyStatus) keyStatus.className = 'badge bg-secondary';
        if (keyStatusText) keyStatusText.textContent = 'Chưa có khóa';
        if (statusIcon) {
            statusIcon.className = 'fas fa-circle text-danger';
        }
        if (uploadForm) {
            uploadForm.classList.add('disabled');
            uploadForm.querySelector('button[type="submit"]').disabled = true;
        }
    }
}

// Kiểm tra trạng thái khóa
function checkKeyStatus() {
    // Thử tải khóa hiện có
    loadKeys().catch(() => {
        updateKeyStatus(false);
    });
}

// Toggle hiển thị khóa
function toggleKeyDisplay() {
    const keyDisplay = document.getElementById('keyDisplay');
    const toggleBtn = document.getElementById('toggleKeyBtn');
    
    if (keyDisplay.style.display === 'none') {
        keyDisplay.style.display = 'block';
        if (toggleBtn) toggleBtn.innerHTML = '<i class="fas fa-eye-slash"></i> Ẩn khóa';
    } else {
        keyDisplay.style.display = 'none';
        if (toggleBtn) toggleBtn.innerHTML = '<i class="fas fa-eye"></i> Hiện khóa';
    }
}

// Copy text to clipboard
async function copyToClipboard(elementId) {
    try {
        const element = document.getElementById(elementId);
        const text = element.textContent;
        
        await navigator.clipboard.writeText(text);
        showAlert('Đã copy vào clipboard!', 'success', 2000);
        
        // Visual feedback
        element.style.background = '#d4edda';
        setTimeout(() => {
            element.style.background = '';
        }, 1000);
        
    } catch (error) {
        // Fallback for older browsers
        const element = document.getElementById(elementId);
        const textArea = document.createElement('textarea');
        textArea.value = element.textContent;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        showAlert('Đã copy vào clipboard!', 'success', 2000);
    }
}

// Validate file size
function validateFileSize(input) {
    const maxSize = 50 * 1024 * 1024; // 50MB
    
    if (input.files[0] && input.files[0].size > maxSize) {
        showAlert('File quá lớn! Kích thước tối đa là 50MB.', 'warning');
        input.value = '';
        return false;
    }
    return true;
}

// Xử lý upload và ký file
async function handleFileUpload(event) {
    event.preventDefault();
    
    // Kiểm tra trạng thái khóa
    const keyStatusText = document.getElementById('keyStatusText');
    if (keyStatusText && keyStatusText.textContent === 'Chưa có khóa') {
        showAlert('Vui lòng tạo hoặc tải khóa RSA trước khi ký file!', 'warning');
        return;
    }
    
    const formData = new FormData();
    const fileInput = document.getElementById('fileInput');
    
    if (!fileInput.files[0]) {
        showAlert('Vui lòng chọn file!', 'warning');
        return;
    }
    
    if (!validateFileSize(fileInput)) {
        return;
    }
    
    formData.append('file', fileInput.files[0]);
    
    // Hiển thị progress bar
    const progressContainer = document.getElementById('uploadProgress');
    const progressBar = progressContainer.querySelector('.progress-bar');
    progressContainer.style.display = 'block';
    progressBar.style.width = '0%';
    
    try {
        // Animate progress bar
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += Math.random() * 30;
            if (progress > 90) progress = 90;
            progressBar.style.width = progress + '%';
        }, 100);
        
        const response = await fetch('/sign_file', {
            method: 'POST',
            body: formData
        });
        
        clearInterval(progressInterval);
        progressBar.style.width = '100%';
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Lỗi không xác định khi ký file');
        }
        
        const data = await response.json();
        
        if (data.success) {
            currentSignature = data.signature;
            currentFileName = data.filename;
            currentOriginalFileName = data.original_filename;
            
            // Hiển thị kết quả
            document.getElementById('signedFileName').textContent = data.filename;
            document.getElementById('originalFileName').textContent = data.original_filename;
            document.getElementById('signedTime').textContent = formatDateTime(data.timestamp);
            document.getElementById('signature').textContent = data.signature;
            document.getElementById('signResult').style.display = 'block';
            
            showAlert(data.message, 'success');
            
            // Reset form
            fileInput.value = '';
            
            // Tải lại danh sách file
            loadFileList();
            
        } else {
            throw new Error(data.error || 'Lỗi không xác định khi ký file');
        }
        
    } catch (error) {
        showAlert('Lỗi: ' + error.message, 'danger');
    } finally {
        // Ẩn progress bar sau 1 giây
        setTimeout(() => {
            progressContainer.style.display = 'none';
        }, 1000);
    }
}

// Xử lý xác minh chữ ký
async function handleVerifySignature(event) {
    event.preventDefault();
    
    const formData = new FormData();
    const fileInput = document.getElementById('verifyFileInput');
    const signature = document.getElementById('signatureInput').value.trim();
    const publicKey = document.getElementById('publicKeyInput').value.trim();
    
    if (!fileInput.files[0]) {
        showAlert('Vui lòng chọn file cần xác minh!', 'warning');
        return;
    }
    
    if (!signature) {
        showAlert('Vui lòng nhập chữ ký số!', 'warning');
        return;
    }
    
    if (!validateFileSize(fileInput)) {
        return;
    }
    
    formData.append('file', fileInput.files[0]);
    formData.append('signature', signature);
    if (publicKey) {
        formData.append('public_key', publicKey);
    }
    
    try {
        showAlert('Đang xác minh chữ ký...', 'info');
        
        const response = await fetch('/verify_signature', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        const resultDiv = document.getElementById('verifyResult');
        
        if (data.success) {
            resultDiv.innerHTML = data.valid
                ? `<div class="alert alert-success">
                    <h6><i class="fas fa-check-circle"></i> Chữ ký hợp lệ!</h6>
                    <p><strong>File:</strong> ${data.filename}</p>
                    <p><strong>Thời gian kiểm tra:</strong> ${formatDateTime(data.timestamp)}</p>
                    <p class="mb-0">File này đã được ký bởi chủ sở hữu khóa.</p>
                   </div>`
                : `<div class="alert alert-danger">
                    <h6><i class="fas fa-times-circle"></i> Chữ ký không hợp lệ!</h6>
                    <p><strong>File:</strong> ${data.filename}</p>
                    <p><strong>Thời gian kiểm tra:</strong> ${formatDateTime(data.timestamp)}</p>
                    <p class="mb-0">Chữ ký không khớp hoặc file đã bị thay đổi.</p>
                   </div>`;
            
            showAlert(data.message, data.valid ? 'success' : 'danger');
            
            // Reset form
            if (data.valid) {
                fileInput.value = '';
                document.getElementById('signatureInput').value = '';
                document.getElementById('publicKeyInput').value = '';
            }
            
        } else {
            showAlert('Lỗi: ' + data.error, 'danger');
        }
        
    } catch (error) {
        showAlert('Lỗi kết nối: ' + error.message, 'danger');
    }
}

// Tải danh sách file
async function loadFileList() {
    try {
        const response = await fetch('/file_list');
        const data = await response.json();
        
        const fileList = document.getElementById('fileList');
        if (!fileList) return;

        // Kiểm tra data có phải là mảng không
        if (!Array.isArray(data)) {
            showAlert('Lỗi: Dữ liệu không hợp lệ', 'danger');
            fileList.innerHTML = '<tr><td colspan="5" class="text-center">Không thể tải danh sách file</td></tr>';
            return;
        }
        
        if (data.length === 0) {
            fileList.innerHTML = '<tr><td colspan="5" class="text-center">Chưa có file nào</td></tr>';
            return;
        }
        
        fileList.innerHTML = data.map(file => `
            <tr>
                <td>${file.filename}</td>
                <td>${formatFileSize(file.size)}</td>
                <td>${formatDateTime(file.modified)}</td>
                <td>
                    ${file.has_signature 
                        ? '<span class="badge bg-success"><i class="fas fa-check"></i> Đã ký</span>'
                        : '<span class="badge bg-secondary"><i class="fas fa-times"></i> Chưa ký</span>'}
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <a href="/download/${encodeURIComponent(file.filename)}" 
                           class="btn btn-primary" 
                           title="Tải file">
                            <i class="fas fa-download"></i>
                        </a>
                        ${file.has_signature ? `
                            <a href="/download_signature/${encodeURIComponent(file.filename)}" 
                               class="btn btn-info" 
                               title="Tải file chữ ký">
                                <i class="fas fa-signature"></i>
                            </a>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        const fileList = document.getElementById('fileList');
        if (fileList) {
            fileList.innerHTML = '<tr><td colspan="5" class="text-center">Không thể tải danh sách file</td></tr>';
        }
        showAlert('Lỗi tải danh sách file: ' + error.message, 'danger');
    }
}

// Auto-fill form xác minh khi click vào file đã ký
function fillVerifyForm(filename, signature) {
    const verifyForm = document.getElementById('verifyForm');
    if (!verifyForm) return;
    
    // Scroll đến form
    verifyForm.scrollIntoView({ behavior: 'smooth' });
    
    // Auto-fill signature
    document.getElementById('signatureInput').value = signature;
    
    // Focus vào input file
    document.getElementById('verifyFileInput').focus();
}