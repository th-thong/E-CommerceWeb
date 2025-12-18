# Hướng dẫn sử dụng

## 1. Các endpoint api
- Các endpoint api trong tài liệu api ở http://127.0.0.1:8000/api/docs/

## 2. Cách chạy thử

### Cách 1: Docker

1. Tải docker về máy, cài đặt, chạy docker
2. Pull về bằng lệnh ```docker pull ghcr.io/thong000/shoplitex-backend:latest```
3. Từ thư mục chính chạy lệnh ```docker run -d -p 8000:10000 --env-file src/backend/.env ghcr.io/thong000/shoplitex-backend:latest```


### Cách 2: File requirements.txt

1. Thiết lập môi trường ảo (có thể sử dụng môi trường của máy nếu muốn)

```
python -m venv .venv
.venv/Scripts/activate
```

2. Tải các thư viện, framework cần thiết

```
pip install -r src/backend/requirements.txt
```

3. Chạy server

```
cd src/backend
python manage.py runserver
```

