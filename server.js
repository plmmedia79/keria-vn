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

function vietnamTime() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const value = (type) => parts.find((part) => part.type === type)?.value;

  return `${value("day")}/${value("month")}/${value("year")} ${value("hour")}:${value("minute")}:${value("second")} UTC+7`;
}

function extractClaimCodes(req) {
  try {
    const codes = JSON.parse(req.headers["x-claim-codes"] || "[]");
    return Array.isArray(codes) ? codes : [];
  } catch {
    return [];
  }
}

function logClaimedCodes(req, payload) {
  const submittedCodes = extractClaimCodes(req);

  (payload.items || []).forEach((item, index) => {
    if (!item.ok) { return; }

    console.log(JSON.stringify({
      event: "mail_key_claimed",
      code: item.code || submittedCodes[index] || "unknown",
      claimed_at: vietnamTime(),
      email: item.email || item.masked_email || null,
    }));
  });
}

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
        proxyReq.setHeader("Accept-Encoding", "identity");
        proxyReq.removeHeader("X-Claim-Codes");
      },
      proxyRes: (proxyRes, req) => {
        if (req.method !== "POST" || req.originalUrl !== "/api/pickup/mail-keys") {
          return;
        }

        const chunks = [];
        proxyRes.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        proxyRes.on("end", () => {
          try {
            const payload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
            logClaimedCodes(req, payload);
          } catch (error) {
            console.error(`[claim-log] Không thể đọc phản hồi claim: ${error.message}`);
          }
        });
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
