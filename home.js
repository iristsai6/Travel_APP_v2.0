/**
 * home.js
 * 負責渲染 `#home`（旅團大廳 Dashboard）與 `#onboarding`（創建/加入旅團頁面）。
 * 控制旅團驗證碼分享、基本資訊更新與倒數計時器元件掛載。
 */

import { getAppDb } from "./firebase.js";
import { renderSkeleton, showToast } from "./utils.js";
import { startCountdownTimer } from "./algorithm.js";

/**
 * 初始渲染旅團大廳 (Dashboard) 畫面入口
 * @param {HTMLElement} container - 渲染掛載的目标節點
 * @param {Object} currentUser - 目前登入的使用者詳細資料
 */
export async function renderHomePage(container, currentUser) {
    if (!currentUser.currentGroupId) {
        window.location.hash = "#onboarding";
        return;
    }

    // 渲染骨架屏以提升高擬真 UX 體驗
    container.innerHTML = renderSkeleton("dashboard");

    try {
        const groupData = await fetchGroupDetails(currentUser.currentGroupId);
        
        // 組合渲染 HTML
        container.innerHTML = `
            <div class="space-y-6 animate-fade-in">
                <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-indigo-950 p-8 text-white shadow-xl">
                    <div class="relative z-10 space-y-3">
                        <span class="inline-block px-3 py-1 text-xs font-semibold tracking-wider uppercase bg-orange-500 rounded-full">我的目前旅程</span>
                        <h2 class="text-3xl font-extrabold tracking-tight">${groupData.title}</h2>
                        <p class="text-indigo-200 text-sm">旅程時間：${groupData.startDate} ~ ${groupData.endDate}</p>
                        
                        <div id="home-countdown-display" class="grid grid-cols-4 gap-2 max-w-sm pt-4">
                            </div>
                    </div>
                </div>

                <div class="glass-panel rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h4 class="text-sm font-semibold text-slate-500 dark:text-zinc-400">旅團獨家邀請碼</h4>
                        <p class="text-2xl font-mono font-bold tracking-widest text-indigo-600 dark:text-indigo-400 mt-1">${groupData.groupCode}</p>
                    </div>
                    <button id="share-group-code-btn" class="w-full md:w-auto px-6 py-3 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-zinc-950 text-sm font-semibold transition-transform hover:scale-105 active:scale-95">
                        複製分享連結
                    </button>
                </div>
            </div>
        `;

        // 綁定複製連結事件
        document.getElementById("share-group-code-btn").addEventListener("click", () => {
            const shareUrl = `${window.location.origin}${window.location.pathname}?group=${groupData.groupCode}#login`;
            navigator.clipboard.writeText(shareUrl);
            showToast("已成功將旅團專屬邀請連結複製至剪貼簿！", "success");
        });

        // 啟動旅行倒數演算法機制
        const countdownContainer = document.getElementById("home-countdown-display");
        startCountdownTimer(groupData.startDate, countdownContainer);

    } catch (error) {
        showToast("載入旅團資料發生錯誤，請重新整理頁面。", "error");
    }
}

/**
 * 渲染 Onboarding 頁面（創建/加入旅團頁面）
 */
export function renderOnboardingPage(container, currentUser) {
    container.innerHTML = `
        <div class="max-w-md mx-auto space-y-8 py-12 animate-fade-in">
            <div class="text-center space-y-2">
                <h2 class="text-3xl font-black tracking-tight">開啟新旅程</h2>
                <p class="text-slate-500 text-sm">請選擇建立一個全新旅團，或輸入既有邀請碼加入朋友的隊伍。</p>
            </div>
            
            <div class="space-y-4">
                <div class="glass-panel p-6 rounded-2xl space-y-4">
                    <h3 class="text-lg font-bold">加入現有旅團</h3>
                    <div class="flex gap-2">
                        <input type="text" id="join-code-input" placeholder="請輸入 6 位數邀請碼" class="flex-1 px-4 py-3 bg-slate-100 dark:bg-zinc-800 border-0 rounded-xl font-mono text-center tracking-widest focus:ring-2 focus:ring-orange-500" maxLength="8">
                        <button id="submit-join-group-btn" class="px-5 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-colors">加入</button>
                    </div>
                </div>

                <div class="glass-panel p-6 rounded-2xl space-y-4">
                    <h3 class="text-lg font-bold">建立全新旅團</h3>
                    <div class="space-y-3">
                        <input type="text" id="create-title-input" placeholder="例如：2026 東京酷夏創客之旅" class="w-full px-4 py-3 bg-slate-100 dark:bg-zinc-800 border-0 rounded-xl text-sm focus:ring-2 focus:ring-orange-500">
                        <div class="grid grid-cols-2 gap-2">
                            <input type="date" id="create-start-input" class="px-4 py-3 bg-slate-100 dark:bg-zinc-800 border-0 rounded-xl text-sm focus:ring-2 focus:ring-orange-500">
                            <input type="date" id="create-end-input" class="px-4 py-3 bg-slate-100 dark:bg-zinc-800 border-0 rounded-xl text-sm focus:ring-2 focus:ring-orange-500">
                        </div>
                        <input type="number" id="create-budget-input" placeholder="設定旅團初始總預算" class="w-full px-4 py-3 bg-slate-100 dark:bg-zinc-800 border-0 rounded-xl text-sm focus:ring-2 focus:ring-orange-500">
                        <button id="submit-create-group-btn" class="w-full py-3.5 bg-slate-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl font-bold transition-all hover:opacity-90">創建新旅團</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // 綁定事件監聽器
    document.getElementById("submit-join-group-btn").addEventListener("click", () => handleJoinGroup(currentUser));
    document.getElementById("submit-create-group-btn").addEventListener("click", () => handleCreateGroup(currentUser));
}

/**
 * 處理加入既有旅團之商業邏輯
 */
async function handleJoinGroup(user) {
    const code = document.getElementById("join-code-input").value.trim().toUpperCase();
    if (!code) return showToast("請先填入正確的邀請碼", "warning");

    const db = getAppDb();
    if (!db) {
        // 模擬沙盒環境行為
        showToast("沙盒模擬加入旅團成功！", "success");
        user.currentGroupId = "MOCK_GROUP_999";
        window.location.hash = "#home";
        return;
    }
    // 後續於 Phase 4 完善 Firestore 查詢匹配邏輯
}

/**
 * 處理創立新旅團之商業邏輯
 */
async function handleCreateGroup(user) {
    const title = document.getElementById("create-title-input").value.trim();
    const startDate = document.getElementById("create-start-input").value;
    const endDate = document.getElementById("create-end-input").value;
    const budget = document.getElementById("create-budget-input").value;

    if (!title || !startDate || !endDate) return showToast("請完整填寫所有必填欄位", "warning");

    // 後續於 Phase 4 完善 Firestore 文件建立邏輯
    showToast("建立全新旅團成功！", "success");
    window.location.hash = "#home";
}

/**
 * 撈取旅團群組特定詳細資料的常式
 */
export async function fetchGroupDetails(groupId) {
    const db = getAppDb();
    if (!db) {
        return {
            groupId: "MOCK_GROUP_999",
            groupCode: "TRV-89A2",
            title: "2026 模擬沙盒東京之旅",
            startDate: "2026-10-01",
            endDate: "2026-10-10",
            baseBudget: 60000
        };
    }
    // 串接 Firestore 方法
    const { doc, getDoc } = await import(`https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js`);
    const snap = await getDoc(doc(db, "groups", groupId));
    return snap.exists() ? snap.data() : {};
}
