CareerMate sử dụng cơ chế xác thực JWT gồm:
- Access Token (ngắn hạn, lưu localStorage)
- Refresh Token (dài hạn, lưu httpOnly cookie)

Quy trình:
1. Login → trả access token + refresh token cookie
2. FE lưu access token, cookie tự lưu
3. Khi access token hết hạn → FE gọi /auth/token-refresh
4. Server verify refresh token → trả access token mới
5. Logout phải gọi /auth/logout để xóa refresh token phía server
6. FE tự detect missing token và silent refresh khi mở trang

Bảo mật:
- Refresh token luôn nằm trong httpOnly secure cookie
- Access token chỉ sống 5–15 phút
- Refresh token 7–30 ngày
- Token rotation cho mỗi lần refresh
- Tất cả API chạy HTTPS

Kết quả:
- Session an toàn
- UX mượt, không logout tự động
- Chuẩn OAuth2 cho sản phẩm thực tế
