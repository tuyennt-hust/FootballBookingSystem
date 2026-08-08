# Phần 7 - Dịch vụ và thanh toán

Phiên bản: `0.7.0`

## Luồng chính

`Đơn đã xác nhận → chọn dịch vụ → trigger tính tiền → xem hóa đơn → thanh toán`.

Web:

- `/dat-san/:bookingId/hoa-don`
- `POST /dat-san/:bookingId/dich-vu`
- `POST /dat-san/:bookingId/dich-vu/:serviceId/xoa`
- `POST /dat-san/:bookingId/thanh-toan`

Database sử dụng sẵn:

- `fn_them_dich_vu_cho_don`
- `trg_tinh_tien_chi_tiet_dich_vu`
- `trg_cap_nhat_tien_dich_vu`
- `fn_thanh_toan_hoa_don`

Không cần migration và không cần chạy lại seed/functions/triggers nếu Phần 1-6 đã chạy đúng.

## Lưu ý

Thanh toán ở Phần 7 là mô phỏng: hệ thống đổi trạng thái hóa đơn sang `Da thanh toan`. Chưa tích hợp cổng thanh toán bên thứ ba.
