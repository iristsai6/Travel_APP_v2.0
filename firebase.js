/**
 * firebase.js
 * 負責 Firebase App, Auth, Firestore, Storage 的初始化與核心實例管理。
 * 所有服務皆從此模組導出。
 */

// 定義 Firebase Web SDK 的模組 CDN 來源路徑 (使用 v10.x 穩定的 ES Modules 版本)
const FIREBASE_VERSION = "10.12.0";
const AUTH_URL = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-auth.js`;
const FIRESTORE_URL = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-firestore.js`;
const STORAGE_URL = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-storage.js`;
const APP_URL = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app.js`;

// 全域核心實例變數
let appInstance = null;
let authInstance = null;
let firestoreInstance = null;
let storageInstance = null;

/**
 * 讀取本地環境配置或快取中的 Firebase 配置資訊
 * @returns {Object} Firebase 設定物件
 */
export function getFirebaseConfig() {
    // 預設從 localStorage 中獲取動態填入的設定，或傳回預設空結構
    const savedConfig = localStorage.getItem("TRAVEL_APP_FIREBASE_CONFIG");
    if (savedConfig) {
        return JSON.parse(savedConfig);
    }
    // 預設提供一個空的結構，待 Phase 7 使用者依照 README 指引輸入填寫
    return {
        apiKey: "",
        authDomain: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: "",
        appId: ""
    };
}

/**
 * 將使用者填入的全新 Firebase 金鑰組更新寫入本地快取並重新初始化
 * @param {Object} config - 新的 Firebase 配置資訊物件
 */
export function updateFirebaseConfig(config) {
    localStorage.setItem("TRAVEL_APP_FIREBASE_CONFIG", JSON.stringify(config));
    window.location.reload();
}

/**
 * 非同步載入所有遠端 Firebase 依賴組件，完成應用程式初始化
 * @returns {Promise<Object>} 包含初始化完成之 auth, db, storage 的物件
 */
export async function initializeFirebase() {
    if (appInstance) {
        return { auth: authInstance, db: firestoreInstance, storage: storageInstance };
    }

    const config = getFirebaseConfig();
    
    // 如果尚未配置密鑰，則返回未初始化狀態
    if (!config.apiKey) {
        console.warn("Firebase 設定檔尚未填寫，系統將處於展示/離線沙盒模式。");
        return { auth: null, db: null, storage: null };
    }

    try {
        // 動態以 ES Modules import 特性引入 Firebase 基礎模組
        const { initializeApp } = await import(APP_URL);
        const { getAuth } = await import(AUTH_URL);
        const { getFirestore } = await import(FIRESTORE_URL);
        const { getStorage } = await import(STORAGE_URL);

        // 初始化實例
        appInstance = initializeApp(config);
        authInstance = getAuth(appInstance);
        firestoreInstance = getFirestore(appInstance);
        storageInstance = getStorage(appInstance);

        console.log("Firebase 企業級服務叢集初始化成功。");
        return { auth: authInstance, db: firestoreInstance, storage: storageInstance };
    } catch (error) {
        console.error("Firebase 初始化失敗，請檢查金鑰有效性或網路狀態：", error);
        throw error;
    }
}

/**
 * 安全獲取 Auth 實例的方法
 */
export function getAppAuth() {
    return authInstance;
}

/**
 * 安全獲取 Firestore 實例的方法
 */
export function getAppDb() {
    return firestoreInstance;
}

/**
 * 安全獲取 Storage 實例的方法
 */
export function getAppStorage() {
    return storageInstance;
}
