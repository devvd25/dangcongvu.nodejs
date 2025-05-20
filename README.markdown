# Hệ Thống Đặt Món Ăn Trực Tuyến - ADMIN : Đặng Công Vũ

Đây là dự án **Hệ Thống Đặt Món Ăn Trực Tuyến** được xây dựng bằng **Node.js**, **Express**, **MongoDB**, và giao diện sử dụng **Pug**. Dự án cho phép khách hàng đăng ký, đăng nhập, tìm kiếm và đặt món ăn, trong khi admin có thể quản lý món ăn, đơn hàng, người dùng, logo, và banner.

Dưới đây là hướng dẫn chi tiết về chức năng của từng file trong dự án.

## Cấu trúc thư mục

```
Vidu7_88/
├── data/
│   └── sampleDishes.js
├── models/
│   ├── monan.model.js
│   ├── order.model.js
│   ├── settings.model.js
│   └── user.model.js
├── public/
│   ├── images/
│   │   ├── logo.png
│   │   └── banner.png
│   └── stylesheets/
│       └── style.css
├── routes/
│   └── index.js
├── views/
│   ├── error.pug
│   ├── index.pug
│   ├── layout.pug
│   ├── login.pug
│   ├── menu.pug
│   ├── order-form.pug
│   ├── orders.pug
│   ├── register.pug
│   ├── settings.pug
│   └── users.pug
├── .env
├── app.js
├── package.json
├── setupAdmin.js
└── setupSettings.js
```

## Mô tả chức năng từng file

### **Thư mục gốc**
- **`.env`**: File chứa biến môi trường, bao gồm URL kết nối MongoDB (`DB_URL=mongodb://localhost/CRUD_monan`).
- **`app.js`**: File chính của ứng dụng, khởi tạo server Express, cấu hình middleware (session, passport, socket.io), kết nối MongoDB, và thiết lập các route.
- **`package.json`**: File chứa thông tin dự án và các dependencies (như `express`, `mongoose`, `multer`, `socket.io`, `sharp`, v.v.).

### **Thư mục `data`**
- **`sampleDishes.js`**: File chứa dữ liệu mẫu các món ăn (tên, giá, mô tả, hình ảnh) để admin tự động điền thông tin khi thêm món ăn mới. Dữ liệu này có thể được thay thế bằng API thực tế hoặc web scraping.

### **Thư mục `models`**
- **`monan.model.js`**: Model định nghĩa schema cho món ăn (`tenMon`, `gia`, `moTa`, `image`).
- **`order.model.js`**: Model định nghĩa schema cho đơn hàng (`userId`, `monanId`, `tenMon`, `gia`, `quantity`, `customerName`, `phone`, `address`, `status`, `statusHistory`).
- **`settings.model.js`**: Model định nghĩa schema cho cài đặt logo và banner (`key`, `value`).
- **`user.model.js`**: Model định nghĩa schema cho người dùng (`username`, `password`, `role`).

### **Thư mục `public`**
- **`public/images/`**:
  - **`logo.png`**: Hình ảnh logo mặc định.
  - **`banner.png`**: Hình ảnh banner mặc định.
- **`public/stylesheets/style.css`**: File CSS chứa các kiểu dáng cho giao diện (màu sắc, kích thước banner, logo, form, v.v.).

### **Thư mục `routes`**
- **`index.js`**: File chứa tất cả các route của ứng dụng:
  - `/` (GET, POST): Hiển thị và thêm món ăn (admin).
  - `/update` (POST): Cập nhật món ăn (admin).
  - `/delete` (POST): Xóa món ăn (admin).
  - `/menu` (GET): Hiển thị danh sách món ăn và đơn hàng cho khách hàng.
  - `/order-form/:monanId` (GET): Hiển thị form đặt món.
  - `/order` (POST): Tạo đơn hàng mới.
  - `/orders` (GET): Hiển thị danh sách đơn hàng (admin).
  - `/update-order-status` (POST): Cập nhật trạng thái đơn hàng.
  - `/delete-order` (POST): Xóa đơn hàng.
  - `/search-dish` (GET): Tìm kiếm món ăn tự động để thêm (admin).
  - `/settings` (GET): Hiển thị trang quản lý logo và banner.
  - `/update-logo` (POST): Cập nhật logo.
  - `/update-banner` (POST): Cập nhật banner (với resize bằng `sharp`).
  - `/users` (GET): Hiển thị danh sách người dùng (admin).
  - `/delete-user` (POST): Xóa người dùng.

### **Thư mục `views`**
- **`error`**: error handling views for hiển thị thông báo lỗi cho người dùng khi có sự cố xảy ra trong ứng dụng.
- **`index.pug`**: Giao diện admin để quản lý món ăn (thêm, sửa, xóa món ăn, tìm kiếm món ăn).
- **`layout.pug`**: File bố cục chính, chứa cấu trúc HTML cơ bản và các liên kết CSS (Bootstrap), JS (socket.io).
- **`login.pug`**: Giao diện đăng nhập cho admin và khách hàng.
- **`menu.pug`**: Giao diện khách hàng để xem danh sách món ăn, tìm kiếm món ăn, và xem đơn hàng.
- **`order-form.pug`**: Form đặt món, cho phép khách hàng nhập thông tin (tên, số điện thoại, địa chỉ) và lấy vị trí tự động bằng Geolocation.
- **`orders.pug`**: Giao diện admin để quản lý đơn hàng (xem danh sách, cập nhật trạng thái, xóa đơn hàng).
- **`register.pug`**: Giao diện đăng ký tài khoản cho khách hàng.
- **`settings.pug`**: Giao diện admin để quản lý logo và banner (upload logo, banner mới).
- **`users.pug`**: Giao diện admin để quản lý người dùng (xem danh sách, xóa user).

### **Các file khác**
- **`setupAdmin.js`**: File khởi tạo tài khoản admin mặc định (`admin`/`admin123`) trong cơ sở dữ liệu. Chạy một lần:
  ```bash
  node setupAdmin.js
  ```
- **`setupSettings.js`**: File khởi tạo logo và banner mặc định trong cơ sở dữ liệu. Chạy một lần:
  ```bash
  node setupSettings.js
  ```

## Hướng dẫn chạy dự án

1. **Cài đặt dependencies**:
   ```bash
   npm install
   ```

2. **Khởi tạo tài khoản admin và cài đặt mặc định**:
   ```bash
   node setupAdmin.js
   node setupSettings.js
   ```

3. **Khởi động server**:
   ```bash
   nodemon app.js
   ```

4. **Truy cập giao diện**:
   - Giao diện admin: `http://localhost:5555` (đăng nhập với `admin`/`admin123`).
   - Giao diện khách hàng: `http://localhost:5555/menu` (đăng nhập với tài khoản khách hàng đã đăng ký).

## Các tính năng chính

- **Khách hàng**:
  - Đăng ký, đăng nhập, tìm kiếm món ăn, đặt món, xem đơn hàng.
  - Nhận thông báo thời gian thực khi trạng thái đơn hàng thay đổi hoặc đơn hàng bị xóa.
- **Admin**:
  - Quản lý món ăn (thêm, sửa, xóa, tìm kiếm tự động).
  - Quản lý đơn hàng (xem, cập nhật trạng thái, xóa).
  - Quản lý người dùng (xem danh sách, xóa user).
  - Quản lý logo và banner (upload và resize banner).

## Lưu ý

- Đảm bảo MongoDB đang chạy trên máy (`mongod`).
- Đảm bảo thư mục `public/uploads/` tồn tại để lưu trữ file upload.
- Nếu không muốn sử dụng `sharp` để resize banner, bạn có thể xóa đoạn mã liên quan trong `routes/index.js` và uninstall `sharp`:
  ```bash
  npm uninstall sharp
  ```