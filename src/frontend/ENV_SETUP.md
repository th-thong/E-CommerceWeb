# Environment Variables Setup

## Tạo file .env

Tạo file `.env` trong thư mục `src/frontend/` với nội dung sau:

```env
# Backend API Configuration

# Backend server URL (for development proxy)
# Local development:
VITE_BACKEND_URL=http://127.0.0.1:8000

# Production example:
# VITE_BACKEND_URL=https://api.yourdomain.com

# API Base URL path
# For same-origin requests (development):
VITE_API_BASE_URL=/api

# For cross-origin requests (production):
# VITE_API_BASE_URL=https://api.yourdomain.com/api

# Admin API Base URL path
VITE_ADMIN_BASE_URL=/shopadmin

# Production example:
# VITE_ADMIN_BASE_URL=https://api.yourdomain.com/shopadmin
```

## Giải thích các biến

### VITE_BACKEND_URL
- **Mục đích**: URL của backend server, dùng cho Vite proxy trong development
- **Development**: `http://127.0.0.1:8000` (hoặc port khác của Django)
- **Production**: `https://api.yourdomain.com` (URL backend thực tế)

### VITE_API_BASE_URL
- **Mục đích**: Base path cho tất cả API endpoints
- **Development**: `/api` (relative path, sẽ được proxy bởi Vite)
- **Production**: 
  - Nếu cùng domain: `/api`
  - Nếu khác domain: `https://api.yourdomain.com/api`

### VITE_ADMIN_BASE_URL
- **Mục đích**: Base path cho Admin API endpoints
- **Development**: `/shopadmin`
- **Production**: 
  - Nếu cùng domain: `/shopadmin`
  - Nếu khác domain: `https://api.yourdomain.com/shopadmin`

## Ví dụ cấu hình

### Local Development
```env
VITE_BACKEND_URL=http://127.0.0.1:8000
VITE_API_BASE_URL=/api
VITE_ADMIN_BASE_URL=/shopadmin
```

### Production (cùng domain)
```env
VITE_BACKEND_URL=https://api.yourdomain.com
VITE_API_BASE_URL=/api
VITE_ADMIN_BASE_URL=/shopadmin
```

### Production (khác domain)
```env
VITE_BACKEND_URL=https://api.yourdomain.com
VITE_API_BASE_URL=https://api.yourdomain.com/api
VITE_ADMIN_BASE_URL=https://api.yourdomain.com/shopadmin
```

## Lưu ý

1. **Vite Environment Variables**: Chỉ các biến bắt đầu với `VITE_` mới được expose cho client-side code
2. **File .env**: File `.env` đã được thêm vào `.gitignore`, không commit lên git
3. **Restart Dev Server**: Sau khi thay đổi `.env`, cần restart Vite dev server
4. **Build**: Khi build production, các giá trị trong `.env` sẽ được embed vào bundle

