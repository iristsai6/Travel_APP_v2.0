/**
 * Firebase 服務初始化模組
 * 負責所有 Firebase 實體的單例化管理與匯出
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// --- 安全性提醒：請勿將真實 Key 提交到公開倉庫 ---
// 建議部署至 GitHub Pages 時，使用環境變數或確保網站安全規則 (Security Rules) 嚴謹
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// 初始化 Firebase 應用實體
const app = initializeApp(firebaseConfig);

// 匯出各項核心服務供其他模組使用 (單例模式)
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

/**
 * 防禦性輔助函式：檢查服務是否正確初始化
 */
export const checkFirebaseStatus = () => {
    return {
        db: !!db,
        auth: !!auth,
        storage: !!storage
    };
};

export default app;
