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

Các link của api được cập nhật tại tài liệu api
Tài khoản admin thong: 12345678
http://127.0.0.1:8000/admin/