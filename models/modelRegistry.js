import mongoose from 'mongoose';


// 輔助函數：將 Collection 名稱轉為 Mongoose Model 名稱
// (例如: 'myusers' -> 'Myuser')
const getModelName = (collectionName) => {
    let name = collectionName.toLowerCase();
    // 簡單的單數化，避免名稱過長
    if (name.endsWith('s') && name.length > 1) {
        name = name.slice(0, -1);
    }
    return name.charAt(0).toUpperCase() + name.slice(1);
};

/**
 * 創建一個新的 Mongoose Model
 * @param {string} collectionName - 集合名稱
 * @param {boolean} isStrict - 是否啟用嚴格模式 (strict: true/false)
 * @returns {mongoose.Model} 新建立的 Model
 */
export const createModel = (collectionName, schemaDefinition = {}, isStrict = true) => {
    const modelName = getModelName(collectionName);

    // 檢查 Model 是否已存在 (Mongoose 的快取)
    if (mongoose.models[modelName]) {
        throw new Error(`Collection '${collectionName}' already exists.`);
    }

    // 定義一個最小化且彈性的 Schema
    const newSchema = new mongoose.Schema(schemaDefinition, {
        timestamps: true, // 自動加入 createdAt, updatedAt
        collection: collectionName, // 指定 MongoDB 集合名稱
        strict: isStrict,           // 根據使用者輸入決定是否嚴格檢查欄位
        strictQuery: false,         // 允許查詢條件中包含未定義欄位
    });

    // 建立並註冊新的 Model
    return mongoose.model(modelName, newSchema);
};

/**
 * 取得一個已註冊的 Mongoose Model
 * @param {string} collectionName - 集合名稱
 * @returns {mongoose.Model | null} Model 或 null
 */
export const getModel = (collectionName) => {
    const modelName = getModelName(collectionName);
    return mongoose.models[modelName] || null;
};