# ----------------------------------------------------
# 階段 1: 建構階段 (Build Stage)
# ----------------------------------------------------
# 使用 Node.js 基礎映象 (選擇一個穩定且適合作業的 LTS 版本)
FROM node:20-alpine AS builder

# 設定工作目錄
WORKDIR /app

# 將 package.json 和 package-lock.json 複製到工作目錄
# 這樣可以利用 Docker 的快取，如果套件沒有變動，可以跳過 npm install
COPY package*.json ./

# 安裝 Node.js 套件
RUN npm install

# 將整個專案的程式碼複製到工作目錄
COPY . .

# ----------------------------------------------------
# 階段 2: 運行階段 (Production Stage)
# ----------------------------------------------------
# 使用一個更小巧的 Node.js 映象來運行程式，減少最終映象大小
FROM node:20-alpine AS final

# 設定環境變數
ENV NODE_ENV=production

# 設定工作目錄
WORKDIR /usr/src/app

# 從 builder 階段複製已安裝的 node_modules 和程式碼
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app .

# 曝露 Express 伺服器運行的連接埠 (預設為 3000，取決於您的 .env 或 server.js 設定)
EXPOSE 3000

# 啟動應用程式的指令
# 注意：這裡使用 node server.js，如果您的啟動腳本在 package.json 裡定義，可以改成 npm start
CMD ["node", "server.js"]