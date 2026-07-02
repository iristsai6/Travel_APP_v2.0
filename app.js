/**
 * app.js
 * 應用程式核心總入口。管轄 SPA Hash 路由配置切換、
 * Firebase 初始化整合、深淺模式切換、以及全域身分異動分配。
 */

import { initializeFirebase } from "./firebase.js";
import { observeAuthState } from "./auth.js";
import { renderHomePage, renderOnboardingPage } from "./home.js";
import { renderItineraryPage } from "./itinerary.js";
import { renderFinancePage } from "./finance.js";
import { renderMapPage } from "./map.js";
import { renderAboutPage } from "./about.js";
import { showToast, toggleGlobalLoading } from "./utils.js";

// 全域狀態管理庫
const APP_STATE = {
    currentUser: null,
    isFirebaseReady: false
};

/**
 * 系統初次執行初始化常式
 */
async function initializeApplication() {
    console.log("應用程式啟動中...");
    setupGlobalThemeController();

    try {
        // 執行 Firebase 初始化
        await initializeFirebase();
        APP_STATE.isFirebaseReady = true;

        // 啟動 Firebase 認證工作階段即時追蹤監聽
        observeAuthState((user) => {
            APP_STATE.currentUser = user;
            updateGlobalSidebarUI(user);
            // 當身分異動或首頁載入時，觸發路由分流
            handleSpaRouterSwitch();
        });

    } catch (err) {
        showToast("系統初始化期間發生重大錯誤，將進入離線沙盒展示模式。", "warning");
        // 離線降級防禦：即使 Firebase 失敗亦能執行路由展示
        handleSpaRouterSwitch();
    }

    // 監聽瀏覽器 Hash 網址切換事件以落實 SPA 機制
    window.addEventListener("hashchange", handleSpaRouterSwitch);
}

/**
 * 核心 SPA Hash 路由切換引擎機制
 */
function handleSpaRouterSwitch() {
    const hash = window.location.hash || "#home";
    const viewContainer = document.getElementById("app-route-view");
    const breadcrumb = document.getElementById("header-breadcrumb");
    if (!viewContainer) return;

    // 阻斷與保護措施：若未登入且不處於註冊狀態，強制全面重導向至登入檢視
    if (!APP_STATE.currentUser && hash !== "#login") {
        window.location.hash = "#login";
        breadcrumb.innerText = "身分認證";
        renderLoginPageView(viewContainer);
        return;
    }

    // 路由對照分流表
    switch (hash) {
        case "#home":
            breadcrumb.innerText = "旅團大廳";
            renderHomePage(viewContainer, APP_STATE.currentUser);
            break;
        case "#onboarding":
            breadcrumb.innerText = "旅團註冊加入";
            renderOnboardingPage(viewContainer, APP_STATE.currentUser);
            break;
        case "#itinerary":
            breadcrumb.innerText = "行程規劃時間軸";
            renderItineraryPage(viewContainer, APP_STATE.currentUser);
            break;
        case "#finance":
            breadcrumb.innerText = "財務記帳分帳";
            renderFinancePage(viewContainer, APP_STATE.currentUser);
            break;
        case "#map":
            breadcrumb.innerText = "地圖導航路線";
            renderMapPage(viewContainer, APP_STATE.currentUser);
            break;
        case "#about":
            breadcrumb.innerText = "個人中心";
            renderAboutPage(viewContainer, APP_STATE.currentUser);
            break;
        case "#login":
            if (APP_STATE.currentUser) {
                window.location.hash = "#home";
            } else {
                renderLoginPageView(viewContainer);
            }
            break;
        default:
            viewContainer.innerHTML = `<div class="p-8 text-center font-bold text-slate-400">404 找不到此頁面</div>`;
    }

    // 同步高亮側邊欄與底部導航項目
    updateActiveNavigationStyles(hash);
}

/**
 * 渲染登入認證視圖
 */
function renderLoginPageView(container) {
    container.innerHTML = `
        <div class="max-w-md mx-auto glass-panel p-8 rounded-3xl space-y-6 shadow-2xl mt-12 animate-fade-in">
            <h3 class="text-2xl font-black text-center tracking-tight">歡迎使用 TravelApp</h3>
            <div class="space-y-3">
                <input type="email" id="login-email-field" placeholder="電子信箱" class="w-full px-4 py-3 bg-slate-100 dark:bg-zinc-800 border-0 rounded-xl text-sm">
                <input type="password" id="login-pass-field" placeholder="密碼" class="w-full px-4 py-3 bg-slate-100 dark:bg-zinc-800 border-0 rounded-xl text-sm">
                <button id="execute-login-btn" class="w-full py-3 bg-orange-500 text-white rounded-xl font-bold text-sm transition-all hover:opacity-90">進入旅程</button>
            </div>
            <p class="text-center text-xs text-slate-400">目前為沙盒展示模式，點擊按鈕即可一鍵免密碼進入系統體驗。</p>
        </div>
    `;

    document.getElementById("execute-login-btn").addEventListener("click", () => {
        // 沙盒一鍵授權模擬登入
        APP_STATE.currentUser = {
            uid: "mock_user_123",
            email: "demo@travelapp.io",
            displayName: "沙盒體驗官",
            photoURL: "",
            currentGroupId: "MOCK_GROUP_999"
        };
        updateGlobalSidebarUI(APP_STATE.currentUser);
        window.location.hash = "#home";
        showToast("歡迎回來！已切換至展示沙盒模組。", "success");
    });
}

/**
 * 同步更新側邊欄與行動裝置 UI 選單狀態
 */
function updateGlobalSidebarUI(user) {
    const nameNode = document.getElementById("sidebar-username");
    const groupNode = document.getElementById("sidebar-group-name");
    const avatarNode = document.getElementById("sidebar-avatar-container");

    if (user) {
        if (nameNode) nameNode.innerText = user.displayName || "新成員";
        if (groupNode) groupNode.innerText = user.currentGroupId ? "📍 東京酷夏創客隊" : "未加入旅團";
        if (avatarNode) {
            avatarNode.classList.remove("animate-pulse", "bg-slate-300");
            avatarNode.innerHTML = `<img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" class="w-full h-full object-cover rounded-full">`;
        }
    } else {
        if (nameNode) nameNode.innerText = "未登入";
        if (groupNode) groupNode.innerText = "請先登入帳號";
    }
}

/**
 * 調整目前作用中導航項目的 Apple / Airbnb 精緻高亮樣式
 */
function updateActiveNavigationStyles(activeHash) {
    const navLinks = document.querySelectorAll('#app-sidebar nav a, #app-mobile-nav a');
    navLinks.forEach(link => {
        const isMatched = link.getAttribute('href') === activeHash;
        if (isMatched) {
            link.className = "flex items-center space-x-3 px-4 py-3 rounded-xl bg-orange-500 text-white shadow-md shadow-orange-500/20 font-bold transition-all text-sm";
        } else {
            link.className = "flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-medium transition-all text-sm";
        }
    });
}

/**
 * 初始化全域 Dark Mode 深淺色切換控制器
 */
function setupGlobalThemeController() {
    const toggleBtn = document.getElementById("theme-toggle-btn");
    if (!toggleBtn) return;

    toggleBtn.addEventListener("click", () => {
        const isDark = document.documentElement.classList.contains("dark");
        if (isDark) {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("TRAVEL_APP_THEME", "light");
        } else {
            document.documentElement.classList.add("dark");
            localStorage.setItem("TRAVEL_APP_THEME", "dark");
        }
    });

    // 讀取快取設定
    const savedTheme = localStorage.getItem("TRAVEL_APP_THEME");
    if (savedTheme === "light") {
        document.documentElement.classList.remove("dark");
    }
}

// 綁定全域 DOM 載入事件啟動核心
document.addEventListener("DOMContentLoaded", initializeApplication);


// 路由表配置
const routes = {
    "#home": renderHomePage,
    "#itinerary": renderItineraryPage,
    "#map": renderMapPage,
    "#finance": renderFinancePage
};

// 路由掛載引擎
function router() {
    const hash = window.location.hash || "#home";
    const container = document.getElementById("app-root");
    
    // 檢查路由是否存在，若無則預設導向 Home
    const routeFunc = routes[hash] || renderHomePage;
    
    // 執行對應頁面渲染
    routeFunc(container);
}

// 監聽 URL 變更與頁面載入
window.addEventListener("hashchange", router);
window.addEventListener("load", router);


