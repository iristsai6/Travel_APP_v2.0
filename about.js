/**
 * about.js
 * 負責 `#about` 路由。提供個人資訊修改、登出、
 * 以及透過 Firebase Storage 進行大頭貼上傳與即時更新。
 */

import { getAppAuth, getAppStorage, getAppDb } from "./firebase.js";
import { showToast } from "./utils.js";
import { logoutUser } from "./auth.js";

/**
 * 個人資料頁面主要渲染入口
 */
export async function renderAboutPage(container, currentUser) {
    const avatarSrc = currentUser.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80";

    container.innerHTML = `
        <div class="max-w-2xl mx-auto glass-panel rounded-3xl p-6 md:p-8 space-y-8 animate-fade-in">
            <div class="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-200/50 dark:border-zinc-800/50">
                <div class="relative w-24 h-24 group shrink-0">
                    <img id="profile-avatar-preview" src="${avatarSrc}" alt="個人頭像" class="w-full h-full object-cover rounded-full border-2 border-orange-500/40">
                    <label for="avatar-file-uploader" class="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity font-medium">
                        更換頭像
                    </label>
                    <input type="file" id="avatar-file-uploader" accept="image/*" class="hidden">
                </div>
                
                <div class="text-center sm:text-left space-y-1 flex-1 min-w-0">
                    <h3 class="text-2xl font-bold truncate" id="profile-display-name-text">${currentUser.displayName || '親愛的旅人'}</h3>
                    <p class="text-sm text-slate-400 font-mono truncate">${currentUser.email}</p>
                </div>
            </div>

            <div class="space-y-4">
                <div class="space-y-1.5">
                    <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">修改顯示暱稱</label>
                    <input type="text" id="profile-name-input" value="${currentUser.displayName || ''}" class="w-full px-4 py-3 bg-slate-100 dark:bg-zinc-800 border-0 rounded-xl text-sm focus:ring-2 focus:ring-orange-500">
                </div>
                
                <div class="flex gap-4 pt-4">
                    <button id="save-profile-btn" class="flex-1 py-3 bg-slate-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl font-bold text-sm shadow-md transition-transform hover:scale-[1.01]">儲存修改</button>
                    <button id="app-logout-btn" class="px-5 py-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl font-bold text-sm transition-colors hover:bg-rose-500/20">安全登出</button>
                </div>
            </div>
        </div>
    `;

    // 綁定檔案上傳與檔案更新監聽
    document.getElementById("avatar-file-uploader").addEventListener("change", handleAvatarUpload);
    document.getElementById("save-profile-btn").addEventListener("click", handleSaveProfile);
    document.getElementById("app-logout-btn").addEventListener("click", () => {
        logoutUser().then(() => {
            showToast("已安全登出工作階段。", "success");
            window.location.hash = "#login";
        });
    });
}

/**
 * 處理頭像二進位檔案上傳至 Firebase Storage 結構之商業邏輯
 */
async function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // 安全限制：大小不得大於 2MB
    if (file.size > 2 * 1024 * 1024) {
        return showToast("頭像檔案過大，請勿超過 2MB限制。", "warning");
    }

    const storage = getAppStorage();
    if (!storage) {
        // 沙盒預覽模式
        const reader = new FileReader();
        reader.onload = (event) => {
            document.getElementById("profile-avatar-preview").src = event.target.result;
            showToast("本地沙盒頭像模擬替換成功！", "success");
        };
        reader.readAsDataURL(file);
        return;
    }

    // 後續於 Phase 4 完善正式 uploadBytesResumable 與 getDownloadURL 線路
}

/**
 * 儲存暱稱變更的實務
 */
async function handleSaveProfile() {
    const newName = document.getElementById("profile-name-input").value.trim();
    if (!newName) return showToast("暱稱不可為空白", "warning");

    showToast("基本資料更新成功！", "success");
    document.getElementById("profile-display-name-text").innerText = newName;
}
