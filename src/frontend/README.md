# Cách chạy chương trình

## Development

1. Cài đặt nodejs
2. Cài đặt dependencies:
   ```bash
   npm install
   ```

3. (Tùy chọn) Tạo file `.env` để cấu hình API:
   ```bash
   # Copy file .env.example (nếu có) hoặc tạo file .env mới
   # Thêm các biến sau:
   VITE_BACKEND_URL=http://127.0.0.1:8000
   VITE_API_BASE_URL=/api
   VITE_ADMIN_BASE_URL=/shopadmin
   ```

4. Chạy development server:
   ```bash
   npm run dev
   ```

## Environment Variables

Các biến môi trường có thể được cấu hình trong file `.env`:

- `VITE_BACKEND_URL`: URL của backend server (mặc định: `http://127.0.0.1:8000`)
- `VITE_API_BASE_URL`: Base path cho API endpoints (mặc định: `/api`)
- `VITE_ADMIN_BASE_URL`: Base path cho Admin API endpoints (mặc định: `/shopadmin`)

### Ví dụ cho Production:

```env
VITE_BACKEND_URL=https://api.yourdomain.com
VITE_API_BASE_URL=https://api.yourdomain.com/api
VITE_ADMIN_BASE_URL=https://api.yourdomain.com/shopadmin
```

### Ví dụ cho Development:

```env
VITE_BACKEND_URL=http://127.0.0.1:8000
VITE_API_BASE_URL=/api
VITE_ADMIN_BASE_URL=/shopadmin
```

Lưu ý: Vite chỉ expose các biến bắt đầu với `VITE_` cho client-side code.