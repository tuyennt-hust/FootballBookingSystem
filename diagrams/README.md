# Diagrams

Bốn sơ đồ chính thức của thiết kế cuối:

- `ERD.png`: 10 bảng nghiệp vụ và quan hệ khóa ngoại.
- `UseCase.png`: chức năng theo Khách hàng, Chủ sân và Admin.
- `Architecture.png`: luồng Route -> Middleware -> Controller -> Service -> Repository -> PostgreSQL.
- `SequenceBooking.png`: luồng tạo booking từ chọn slot đến function/trigger và commit.

Bản SVG tương ứng cũng được lưu cùng thư mục để xem rõ khi phóng to.

Source nằm trong `diagrams/source/`: Graphviz `.dot` cho ERD/Use Case/Architecture và SVG editable cho Sequence Booking (kèm `.dot` flow tham chiếu).

Render lại trên máy có Graphviz:

```bash
dot -Tpng -Gdpi=150 diagrams/source/ERD.dot -o diagrams/ERD.png
```
