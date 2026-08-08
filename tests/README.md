# Tests

## Unit tests

```powershell
npm test
```

Bộ test cuối bao phủ:

- authentication/bcrypt;
- session redirect;
- CSRF và security headers;
- date/time và pitch availability;
- booking/hủy đơn;
- owner validation và giá thuê;
- dịch vụ/payment;
- admin validation;
- customer authorization.

## Static + architecture audit

```powershell
npm run verify
npm run audit
```

Hoặc chạy gộp:

```powershell
npm run check
```

## Database final check

```powershell
npm run db:check
```

Lệnh dùng kết nối trong `.env` và chỉ đọc dữ liệu.

SQL tương đương:

```powershell
psql -U postgres -d dat_san_bong -v ON_ERROR_STOP=1 -f tests/database/final_smoke_test.sql
```

## Integration SQL theo từng module

Các file `owner_management_test.sql`, `payment_flow_test.sql`, `admin_management_test.sql` và các file tương tự dùng transaction/rollback để kiểm tra function/trigger. Đọc phần đầu mỗi file trước khi chạy.
