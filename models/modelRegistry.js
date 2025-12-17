import mongoose from 'mongoose';


// 定義一個專門用於儲存其他 Model Schema 的結構
const SchemaRegistrySchema = new mongoose.Schema({
    collectionName: { type: String, required: true, unique: true }, // 儲存集合名稱 (e.g., 'users')
    schemaDefinition: { type: mongoose.Schema.Types.Mixed, default: {} }, // 儲存使用者提供的 JSON Schema 定義
    isStrict: { type: Boolean, default: true },
    modelName: { type: String, required: true, unique: true } // Mongoose 內部使用的 Model 名稱 (e.g., 'User')
}, { collection: '_schema_registry' }); // 專門的集合名稱

// 建立 Schema 註冊表 Model
const SchemaRegistry = mongoose.model('SchemaRegistry', SchemaRegistrySchema);

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
 * 取得一個已註冊的 Mongoose Model
 * @param {string} collectionName - 集合名稱
 * @returns {mongoose.Model | null} Model 或 null
 */
export const getModel = (collectionName) => {
    const modelName = getModelName(collectionName);
    return mongoose.models[modelName] || null;
};

/**
 * 創建一個新的 Mongoose Model
 * @param {string} collectionName - 集合名稱
 * @param {boolean} isStrict - 是否啟用嚴格模式 (strict: true/false)
 * @returns {mongoose.Model} 新建立的 Model
 */
export const createModel = async(collectionName, schemaDefinition = {}, isStrict = true) => {
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
    const newModel = mongoose.model(modelName, newSchema);

    // 將 Model 定義持久化到 _schema_registry 集合
    try {
        await SchemaRegistry.create({
            collectionName,
            schemaDefinition,
            isStrict,
            modelName
        });
        console.log(`[Schema Registry] Schema for ${collectionName} persisted.`);
    } catch (e) {
        // 如果遇到重複鍵錯誤 (11000)，表示已存在於 DB，只需在記憶體中建立即可
        if (e.code === 11000) { 
             console.warn(`[Schema Registry] ${collectionName} already persisted in DB. Model recreated in memory.`);
        } else {
             throw e;
        }
    }

    return newModel;
};

/**
 * 刪除 Model
 * @param {string} collectionName - 集合名稱
 */
export const deleteModel = async(collectionName) => {
    const modelName = getModelName(collectionName);

    try {
        // Remove model from mongoose cache (if present)
        if (typeof mongoose.modelNames === 'function' && mongoose.modelNames().includes(modelName)) {
            if (typeof mongoose.deleteModel === 'function') {
                mongoose.deleteModel(modelName);
            } else {
                delete mongoose.connection.models[modelName];
                delete mongoose.models[modelName];
            }
            console.log(`[Schema Registry] Collection '${modelName}' removed from mongoose cache.`);
        }

        // Drop the MongoDB collection if it exists
        const db = mongoose.connection && mongoose.connection.db;
        if (db) {
            const existing = await db.listCollections({ name: collectionName }).toArray();
            if (existing.length > 0) {
                await db.dropCollection(collectionName);
                console.log(`[Schema Registry] Collection '${collectionName}' dropped from DB.`);
            } else {
                console.warn(`[Schema Registry] Collection '${collectionName}' does not exist in DB.`);
            }
        } else {
            console.warn('[Schema Registry] No DB connection available to drop collection.');
        }

        // Remove the schema registry entry
        const res = await SchemaRegistry.deleteOne({ collectionName });
        if (res && res.deletedCount) {
            console.log(`[Schema Registry] Registry entry for '${collectionName}' removed.`);
        } else {
            console.warn(`[Schema Registry] No registry entry found for '${collectionName}'.`);
        }

        return true;
    } catch (err) {
        console.error(`[Schema Registry] Failed to delete collection '${collectionName}':`, err.message || err);
        throw err;
    }
}

/**
 * 伺服器啟動時，從 DB 讀取所有註冊的 Schema 並重新建立 Model
 */
export const loadAllModels = async () => {
    try {
        // 讀取所有已持久化的 Schema 定義
        const registeredSchemas = await SchemaRegistry.find({});
        console.log(`[Schema Loader] Found ${registeredSchemas.length} registered schemas in DB.`);

        for (const entry of registeredSchemas) {
            // 使用儲存的定義重新建立 Mongoose Schema
            const schemaOptions = {
                timestamps: true,
                collection: entry.collectionName,
                strict: entry.isStrict,
                strictQuery: false,
            };
            const customSchema = new mongoose.Schema(entry.schemaDefinition, schemaOptions);
            
            // 重新註冊 Model 到 mongoose.models
            mongoose.model(entry.modelName, customSchema);
            console.log(`[Schema Loader] Model '${entry.collectionName}' reloaded successfully.`);
        }
    } catch (error) {
        console.error('❌ FATAL: Failed to load models from Schema Registry:', error.message);
        // 如果這裡失敗，通常是 SchemaRegistry Model 本身定義有問題
    }
}