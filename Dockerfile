# Giao diện "Lấy mã Email" tiếng Việt + proxy tới keria
FROM node:22-alpine

# Thư mục làm việc trong container
WORKDIR /app

# Cài dependency trước (tận dụng cache layer của Docker)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy phần còn lại của source
COPY . .

# Cấu hình mặc định — có thể override trong Coolify (Environment Variables)
ENV NODE_ENV=production
ENV PORT=3000
ENV UPSTREAM=https://plus.keria.cc.cd

# Cổng container lắng nghe (khai báo cho Coolify map)
EXPOSE 3000

# Chạy bằng user không phải root cho an toàn
USER node

CMD ["node", "server.js"]
