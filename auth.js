/**
 * auth.js
 * 封裝 Firebase Authentication 之登入、註冊、手機登入、忘記密碼、與工作階段維持。
 * 處理與 users 集合之對應關聯同步。
 */

import { getAppAuth, getAppDb } from "./firebase.js";

/**
 * 監聽使用者帳號登入狀態改變之全域生命週期
 * @param {Function} callback - 狀態變化時的回呼常式，傳入 user 物件或 null
 */
export function observeAuthState(callback) {
    const auth = getAppAuth();
    if (!auth) {
        // 離線模擬環境處理
        setTimeout(() => callback(getMockUser()), 500);
        return;
    }
    // 引用遠端模組方法進行狀態追蹤
    const FIREBASE_VERSION = "10.12.0";
    import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-auth.js`).then(({ onAuthStateChanged }) => {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userDoc = await fetchUserProfile(user.uid);
                callback({ ...user, ...userDoc });
            } else {
                callback(null);
            }
        });
    });
}

/**
 * 使用信箱與密碼註冊全新帳戶
 * @param {string} email - 電子信箱
 * @param {string} password - 加密密碼明文
 * @param {string} displayName - 顯示暱稱
 * @returns {Promise<Object>} Firebase 註冊成功之用戶憑證
 */
export async function registerWithEmail(email, password, displayName) {
    const auth = getAppAuth();
    if (!auth) return { uid: "mock_user_123", displayName };

    const { createUserWithEmailAndPassword, updateProfile } = await import(`https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js`);
    const { doc, setDoc } = await import(`https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js`);

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName });
    
    // 初始化 Firestore 的使用者基礎數據文件
    const db = getAppDb();
    await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        email,
        phoneNumber: "",
        displayName,
        photoURL: "",
        currentGroupId: "",
        createdAt: new Date().toISOString()
    });

    return userCredential.user;
}

/**
 * 透過電子信箱與密碼進行登入
 */
export async function loginWithEmail(email, password) {
    const auth = getAppAuth();
    if (!auth) return getMockUser();

    const { signInWithEmailAndPassword } = await import(`https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js`);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
}

/**
 * 發送簡訊驗證碼至手機進行登入 (Phone Number Login)
 * @param {string} phoneNumber - 國際格式手機號碼 (例如: +886912345678)
 * @param {Object} recaptchaVerifier - 畫面上的隱形或顯性驗證器實例
 * @returns {Promise<Object>} confirmationResult 驗證憑證
 */
export async function sendSmsCode(phoneNumber, recaptchaVerifier) {
    const auth = getAppAuth();
    if (!auth) return { confirmation: "mock_confirmation" };

    const { signInWithPhoneNumber } = await import(`https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js`);
    return await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
}

/**
 * 驗證手機簡訊碼完成登入
 */
export async function verifySmsCode(confirmationResult, verificationCode) {
    if (confirmationResult.confirmation === "mock_confirmation") return getMockUser();
    const userCredential = await confirmationResult.confirm(verificationCode);
    return userCredential.user;
}

/**
 * 觸發忘記密碼重設電子郵件
 * @param {string} email - 目標電子信箱
 */
export async function sendPasswordReset(email) {
    const auth = getAppAuth();
    if (!auth) return true;
    const { sendPasswordResetEmail } = await import(`https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js`);
    await sendPasswordResetEmail(auth, email);
    return true;
}

/**
 * 帳戶登出登出切換
 */
export async function logoutUser() {
    const auth = getAppAuth();
    if (!auth) return true;
    const { signOut } = await import(`https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js`);
    await signOut(auth);
    return true;
}

/**
 * 獲取特定使用者在 Firestore 的附加屬性資訊檔案
 */
export async function fetchUserProfile(uid) {
    const db = getAppDb();
    if (!db) return {};
    const { doc, getDoc } = await import(`https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js`);
    const docSnap = await getDoc(doc(db, "users", uid));
    return docSnap.exists() ? docSnap.data() : {};
}

/**
 * 內部測試環境使用之 Mock 資料
 */
function getMockUser() {
    return {
        uid: "mock_user_123",
        email: "demo@travelapp.io",
        displayName: "沙盒體驗官",
        photoURL: "",
        currentGroupId: "MOCK_GROUP_999"
    };
}
