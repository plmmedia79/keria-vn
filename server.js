// Giao diện "Lấy mã Email" tiếng Việt + proxy tới server gốc keria.
// Proxy chạy ở phía server nên KHÔNG dính CORS — các nút bấm hoạt động thật.
//
// Chạy local:   npm install && npm start   ->  http://localhost:8000
// Trên server:  đặt biến môi trường PORT nếu cần (mặc định 8000).

const path = require("path");
const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const PORT = process.env.PORT || 8000;
const UPSTREAM = process.env.UPSTREAM || "https://plus.keria.cc.cd";

// Các đường dẫn này được chuyển tiếp thẳng sang server keria (giữ NGUYÊN path).
const PROXY_PREFIXES = ["/api/", "/pickup", "/after-sale", "/static/"];
const pathFilter = (pathname) =>
  PROXY_PREFIXES.some((p) => pathname === p || pathname.startsWith(p));

app.use(
  createProxyMiddleware({
    pathFilter,                 // chỉ proxy các path này, không cắt tiền tố
    target: UPSTREAM,
    changeOrigin: true,        // đổi Host header thành keria
    xfwd: false,
    on: {
      proxyReq: (proxyReq) => {
        // Một số server chặn request lạ -> giả lập User-Agent trình duyệt.
        proxyReq.setHeader("User-Agent", "Mozilla/5.0");
        proxyReq.setHeader("Referer", UPSTREAM + "/");
      },
    },
  })
);

// Phục vụ giao diện tiếng Việt (public/index.html) ở "/".
app.use(express.static(path.join(__dirname, "public")));

app.listen(PORT, () => {
  console.log(`Giao diện chạy tại:  http://localhost:${PORT}`);
  console.log(`Proxy chuyển tiếp tới: ${UPSTREAM}`);
});
