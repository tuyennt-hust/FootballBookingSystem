# Phần 8 - Quản trị viên

## URL giao diện

- `/admin`: dashboard.
- `/admin/tai-khoan`: quản lý tài khoản.
- `/admin/khu-vuc`: quản lý khu vực.
- `/admin/san-bong`: toàn bộ sân.
- `/admin/don-dat-san`: toàn bộ đơn.
- `/admin/hoa-don`: toàn bộ hóa đơn.
- `/admin/thong-ke`: báo cáo.

## Quy tắc an toàn

- Chỉ role `Admin` truy cập được.
- Không cho khóa chính tài khoản Admin đang đăng nhập.
- Không cho thay đổi trạng thái bất kỳ tài khoản Admin nào từ giao diện này.
- Khóa khách/chủ sân sẽ thu hồi session web của tài khoản đó.
- Không xóa khu vực khi còn sân tham chiếu.
- Tất cả truy vấn lọc dùng PostgreSQL parameter.

## Database

Không có migration mới. Phần 8 dùng schema/function/view đang có, đặc biệt `fn_top_10_khach_hang_chi_tieu`, `fn_phan_loai_khach_hang`, các view doanh thu và bảng nghiệp vụ gốc.
