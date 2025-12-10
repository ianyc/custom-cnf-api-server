const express = require('express');
const router = express.Router();
const Item = require('../models/Item'); // 引入步驟 4 中定義的 Model

// --- 實現 CRUD 操作 ---

// 1. CREATE (新增資料) - POST /api/items
router.post('/', async (req, res) => {
    try {
        // 從請求主體 (req.body) 取得要新增的資料
        const newItem = new Item(req.body);
        // 將資料存入 MongoDB
        const savedItem = await newItem.save();
        // 回傳 201 Created 和新增的資料
        res.status(201).json(savedItem);
    } catch (error) {
        // 如果新增失敗（例如必填欄位沒填），回傳 400 Bad Request
        res.status(400).json({ message: error.message });
    }
});

// 2. READ (查詢所有資料) - GET /api/items
router.get('/', async (req, res) => {
    try {
        // 使用 .find({}) 查詢所有 Item 文件
        const items = await Item.find({});
        // 回傳 200 OK 和查詢結果
        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ message: error.message }); // 伺服器錯誤
    }
});

// 3. READ (查詢單一資料) - GET /api/items/:id
router.get('/:id', async (req, res) => {
    try {
        // 使用 .findById 根據 URL 參數中的 id 查詢單一文件
        const item = await Item.findById(req.params.id);
        
        if (!item) {
            // 找不到資料則回傳 404 Not Found
            return res.status(404).json({ message: '找不到該筆資料' });
        }
        
        res.status(200).json(item);
    } catch (error) {
        // 如果 ID 格式錯誤 (例如太短)，也會進到這裡
        res.status(500).json({ message: error.message });
    }
});

// 4. UPDATE (更新資料) - PATCH /api/items/:id
// 使用 PATCH 而非 PUT，因為 PATCH 通常只更新提供的欄位
router.patch('/:id', async (req, res) => {
    try {
        // .findByIdAndUpdate(id, 更新資料, 選項)
        const updatedItem = await Item.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true, runValidators: true } // new: true 回傳更新後的資料；runValidators: true 執行 Schema 定義的驗證
        );

        if (!updatedItem) {
            return res.status(404).json({ message: '找不到該筆資料' });
        }

        res.status(200).json(updatedItem);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// 5. DELETE (刪除資料) - DELETE /api/items/:id
router.delete('/:id', async (req, res) => {
    try {
        // .findByIdAndDelete(id) 根據 ID 刪除文件
        const deletedItem = await Item.findByIdAndDelete(req.params.id);

        if (!deletedItem) {
            return res.status(404).json({ message: '找不到該筆資料' });
        }

        // 成功刪除，回傳 204 No Content (或 200 OK)
        res.status(200).json({ message: '資料刪除成功', deletedItem });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 匯出 router 供 server.js 使用
module.exports = router;