import 'dotenv/config'; // 載入環境變數
import express from 'express';
import mongoose from 'mongoose';
import managementRoutes from './routes/managementRoutes.js';
import crudRoutes from './routes/crudRoutes.js';
import { loadAllModels } from './models/modelRegistry.js';


// 取得環境變數
const PORT = process.env.PORT;
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

        // --- 連線成功後，立即加載所有 Model ---
        await loadAllModels();
    } catch (error) {
        console.error('❌ MongoDB 連線失敗：', error.message);
        // 如果連線失敗，則終止應用程式
        process.exit(1); 
    }
};

const startServer = async () => {
    // 連線到資料庫和 Model 加載完成
    await connectDB(); 
    
    // --- 路由 (Routes) 設置 ---
    // 掛載 API 路由
    // Management Route (例如 /api/inventory/create)
    app.use('/api', managementRoutes);
    // CRUD Routes (例如 /api/inventory, /api/inventory/123)
    app.use('/api', crudRoutes);

    // 根路由測試
    app.get('/', (req, res) => {
        res.send('API Server 運行中...');
    });
    
    // 啟動 Express 伺服器
    app.listen(PORT, () => {
        console.log(`🚀 API 伺服器已啟動，正在監聽連接埠：http://localhost:${PORT}`);
    });
}

// 執行啟動流程
startServer();