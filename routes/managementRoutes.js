import express from 'express';
import { createModel } from '../models/modelRegistry.js';

const managementRoutes = express.Router();

// 建立Collection
// POST /api/:collectionName/create
managementRoutes.post('/:collectionName/create', (req, res) => {
    const { collectionName } = req.params;
    
    // 從 Query String 取得 strict 參數，預設為 true (嚴格)
    const isStrict = req.query.strict === 'false' ? false : true;

    // 從請求主體 (req.body) 取得使用者定義的 Schema 結構
    const schemaDefinition = req.body;

    if (collectionName.length < 3) {
        return res.status(400).json({ message: "Collection名稱過短。" });
    }

    try {
        createModel(collectionName, schemaDefinition, isStrict);
        res.status(201).json({ 
            message: `Collection '${collectionName}' 建立成功。`,
            strictMode: isStrict ? '嚴格 (Strict)' : '彈性 (Flexible)'
        });
    } catch (error) {
        if (error.message.includes('already exists')) {
            return res.status(409).json({ message: error.message }); // 409 衝突
        }
        res.status(500).json({ message: `建立 Model 失敗: ${error.message}` });
    }
});

export default managementRoutes;