# Keria VN — Giao diện "Lấy mã Email" tiếng Việt

Giao diện tiếng Việt + proxy tới server gốc `https://plus.keria.cc.cd`.
Proxy chạy ở backend nên **không bị CORS** → các nút bấm hoạt động thật.

## Cấu trúc
```
keria-vn/
├── server.js          # Express: phục vụ giao diện + proxy API sang keria
├── package.json
└── public/
    └── index.html     # Giao diện tiếng Việt
```

## Chạy local
```bash
npm install
npm start
# Mở http://localhost:8000
```

## Cấu hình (biến môi trường)
| Biến      | Mặc định                      | Ý nghĩa                         |
|-----------|-------------------------------|---------------------------------|
| `PORT`    | `8000`                        | Cổng chạy                       |
| `UPSTREAM`| `https://plus.keria.cc.cd`    | Server gốc để proxy tới         |

## Deploy lên server

**VPS / máy chủ thường:**
```bash
npm install --production
PORT=80 npm start
# hoặc dùng pm2 để chạy nền:
#   npm i -g pm2 && pm2 start server.js --name keria-vn
```

**Các nền tảng (Render / Railway / Heroku...):**
- Build command: `npm install`
- Start command: `npm start`
- Nền tảng tự cấp biến `PORT`, server đã tự đọc.

## Deploy bằng Coolify (Dockerfile)

Project đã có sẵn `Dockerfile` + `.dockerignore`.

1. Tạo **New Resource → Application**, chọn nguồn (Git repo hoặc upload).
2. **Build Pack: `Dockerfile`** (Coolify tự nhận file `Dockerfile` ở thư mục gốc).
3. **Ports Exposes: `3000`** (container lắng nghe cổng 3000 — đã `EXPOSE 3000`).
4. (Tuỳ chọn) Environment Variables nếu muốn đổi:
   - `UPSTREAM` = `https://plus.keria.cc.cd` (server gốc để proxy)
   - `PORT` = `3000` (nếu đổi thì sửa luôn Ports Exposes cho khớp)
5. Gắn domain trong tab **Domains**, bật SSL, rồi **Deploy**.

> Lưu ý: nếu repo của bạn để `keria-vn/` là thư mục con, đặt **Base Directory** = `/keria-vn` trong Coolify.

## Lưu ý
- Các đường dẫn được proxy sang keria: `/api/*`, `/pickup`, `/after-sale`, `/static/*`.
- File JS gốc của trang (`/static/plus-filebox.js`) được tải trực tiếp từ keria qua proxy.
- Một số thông báo LỖI do backend keria trả về vẫn là tiếng Trung (vd "卡密格式不正确" = thẻ key sai định dạng) — vì chúng sinh ra ở server gốc, không nằm trong giao diện. Nếu muốn dịch luôn các thông báo này thì cần chặn & viết lại response trong `server.js`.
