# Đồ án Công nghệ phần mềm nhóm 8 - ShopLiteX

## Sửa các biến trong file .env

- Uncomment những biến cần và comment những biến cùng tên ở khác mục trong file .env
- Thêm frontend/.env trên drive vào src/frontend/.env, file backend/.env trên drive vào src/backend/.env, file .env vào src/.env
- Lưu ý: không để đồng thời USE_CLOUD_DATABASE=TRUE và USE_CLOUD_STORAGE=FALSE do nó sẽ làm rối database

## Cách chạy chương trình cho local

- Thêm *3* file **.env** vào src/backend, src/backend và src. Các file này nằm trong drive của nhóm
- Chỉnh sửa lại các giá trị trong file .env có hướng dẫn
- ```cd src```
- Chạy lệnh ```docker-compose up``` để chạy tất cả dịch vụ
- Chạy lệnh ```docker-compose up --build``` khi code có thay đổi và build lại
