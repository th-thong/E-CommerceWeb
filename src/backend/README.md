# Hướng dẫn sử dụng

## Cách chạy thử

### Cách 1: File requirements.txt
1. Thiết lập môi trường ảo (có thể sử dụng môi trường của máy nếu muốn)
```bash
python -m venv .venv
.venv/Scripts/activate
```
2. Tải các thư viện, framework cần thiết
```bash
pip install -r src/backend/requirements.txt
```

3. Chạy server
```bash
cd src/backend
python manage.py runserver
```

Sau khi chạy xong vào các link sau để test (có thể test bằng postman đối với các api method khác GET cho dễ)

http://127.0.0.1:8000/admin/ : link này để đăng nhập tài giao diện admin của django (trang này chỉ để test, production không sử  dụng) với tài khoản **thong**, mật khẩu: **12345678**. Trang này cho phép chỉnh sửa database trực tiếp.

http://127.0.0.1:8000/api/user/ : link này trả về list các json của các user

### Cách 2: Docker (Cập nhật sau)