import express from 'express';
import { getModel } from '../models/modelRegistry.js';

const crudRoutes = express.Router();

// Middleware: 檢查 Model 是否存在
const checkModelExistence = (req, res, next) => {
    const { collectionName } = req.params;
    
    const DynamicModel = getModel(collectionName);

    if (!DynamicModel) {
        // Model/Collection 不存在時，立即回傳錯誤
        return res.status(400).json({ 
            message: `錯誤: 找不到Collection '${collectionName}'。請先呼叫 /api/${collectionName}/create 建立。` 
        });
    }

    req.DynamicModel = DynamicModel; // 將 Model 附加到請求物件上，供後續路由使用
    next();
};

// 將 Middleware 應用到所有 CRUD 路徑
crudRoutes.use('/:collectionName', checkModelExistence);

// --- CREATE (新增資料) - POST /api/:collectionName
crudRoutes.post('/:collectionName', async (req, res) => {
    const DynamicModel = req.DynamicModel;
    try {
        const newItem = new DynamicModel(req.body);
        const savedItem = await newItem.save();
        res.status(201).json(savedItem);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// --- READ ALL (查詢所有資料) - GET /api/:collectionName
crudRoutes.get('/:collectionName', async (req, res) => {
    const DynamicModel = req.DynamicModel;
    try {
        const items = await DynamicModel.find({});
        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- READ ONE (查詢單一資料) - GET /api/:collectionName/:id
crudRoutes.get('/:collectionName/:id', async (req, res) => {
    const DynamicModel = req.DynamicModel;
    try {
        const item = await DynamicModel.findById(req.params.id);
        
        if (!item) {
            return res.status(404).json({ message: '找不到該筆資料' });
        }
        
        res.status(200).json(item);
    } catch (error) {
        res.status(400).json({ message: `ID 格式錯誤或伺服器錯誤: ${error.message}` });
    }
});

// --- UPDATE (更新資料) - PATCH /api/:collectionName/:id
crudRoutes.patch('/:collectionName/:id', async (req, res) => {
    const DynamicModel = req.DynamicModel;
    try {
        const updatedItem = await DynamicModel.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true, runValidators: true } 
        );

        if (!updatedItem) {
            return res.status(404).json({ message: '找不到該筆資料' });
        }

        res.status(200).json(updatedItem);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// --- DELETE (刪除資料) - DELETE /api/:collectionName/:id
crudRoutes.delete('/:collectionName/:id', async (req, res) => {
    const DynamicModel = req.DynamicModel;
    try {
        const deletedItem = await DynamicModel.findByIdAndDelete(req.params.id);

        if (!deletedItem) {
            return res.status(404).json({ message: '找不到該筆資料' });
        }

        res.status(200).json({ message: '資料刪除成功', deletedItem });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default crudRoutes;