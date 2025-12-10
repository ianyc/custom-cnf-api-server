// 載入環境變數
require('dotenv').config(); 
const express = require('express');
const mongoose = require('mongoose');

// 取得環境變數
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// 創建 Express 應用程式實例
const app = express();

// Middleware: 啟用解析 JSON 格式的請求主體 (Body)
app.use(express.json());

// --- MongoDB 連線設定 ---
const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ MongoDB 連線成功！');
    } catch (error) {
        console.error('❌ MongoDB 連線失敗：', error.message);
        // 如果連線失敗，則終止應用程式
        process.exit(1); 
    }
};

// 連線到資料庫
connectDB();

// --- 路由 (Routes) 設置 ---
// 這裡將會掛載您的 API 路由，例如：
const itemRoutes = require('./routes/itemRoutes');
app.use('/api/items', itemRoutes); // 所有 /api/items 開頭的請求都導向 itemRoutes

// 根路由測試
app.get('/', (req, res) => {
    res.send('API Server 運行中...');
});

// 啟動伺服器
app.listen(PORT, () => {
    console.log(`🚀 API 伺服器已啟動，正在監聽連接埠：http://localhost:${PORT}`);
});