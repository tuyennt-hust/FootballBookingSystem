# Update Manifest - v0.9.0

Base version: `0.8.0`  
Target version: `0.9.0`

## Phạm vi

- Final audit và security hardening.
- Hoàn thiện customer API còn ở dạng khung.
- Thêm test/audit/database check.
- Hoàn thiện tài liệu và 4 sơ đồ.
- Không thêm npm dependency.
- Không có migration SQL mới.

## Sau khi cập nhật

```powershell
npm run check
npm run db:check
npm run dev
```
