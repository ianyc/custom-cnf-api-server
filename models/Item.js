const mongoose = require('mongoose');

// 1. 定義 Schema: 描述資料庫文件 (Document) 的結構
const itemSchema = new mongoose.Schema({
    // 範例欄位
    name: {
        type: String,
        required: [true, '名稱為必填欄位'], // 設為必填
        trim: true, // 自動去除字串前後的空白
    },
    quantity: {
        type: Number,
        default: 0, // 預設值為 0
    },
    description: {
        type: String,
    },
    // Mongoose 會自動加入 _id
    // timestamp: true 會自動加入 createdAt 和 updatedAt 欄位
}, {
    timestamps: true,
    strict: false, // 允許 Schema 以外的欄位
});

// 2. 建立 Model: 根據 Schema 建立可操作資料庫的 Model
const Item = mongoose.model('Item', itemSchema);

// 匯出 Model 供路由使用
module.exports = Item;