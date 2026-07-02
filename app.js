import { initializeFirebase } from "./firebase.js";
import { observeAuthState } from "./auth.js";
import { renderHomePage, renderOnboardingPage } from "./home.js";
import { renderItineraryPage } from "./itinerary.js";
import { renderFinancePage } from "./finance.js";
import { renderMapPage } from "./map.js";
import { renderAboutPage } from "./about.js";
import { showToast } from "./utils.js";

// 全域狀態配置中心
const APP_CONFIG = {
    container: document.getElementById("app-route-view"),
    breadcrumb: document.getElementById("header-breadcrumb"),
    isAuthReady: false // 鎖定狀態，防止未授權時渲染
};

const APP_STATE = {
    currentUser: null
};

/**
 * 系統初始化：優先級控制
 */
async function initializeApplication() {
    setupGlobalThemeController();

    try {
        await initializeFirebase();
        // 監聽器初始化
        observeAuthState((user) => {
            APP_STATE.currentUser = user;
            APP_CONFIG.isAuthReady = true; // 解鎖渲染
            updateGlobalSidebarUI(user);
            handleSpaRouterSwitch(); // 身分異動後觸發路由重新派發
        });
    } catch (err) {
        console.error("Firebase 初始化失敗:", err);
        APP_CONFIG.isAuthReady = true; 
        showToast("系統以離線模式啟動", "warning");
        handleSpaRouterSwitch();
    }

    window.addEventListener("hashchange", handleSpaRouterSwitch);
}

/**
 * 路由守衛與分流引擎
 */
function handleSpaRouterSwitch() {
    if (!APP_CONFIG.isAuthReady) return; // 鎖定期間拒絕渲染

    const hash = window.location.hash || "#home";
    
    // 路由守衛邏輯
    if (!APP_STATE.currentUser && hash !== "#login") {
        window.location.hash = "#login";
        return;
    }

    // 路由分流映射表
    const routes = {
        "#home": { title: "旅團大廳", render: renderHomePage },
        "#onboarding": { title: "旅團註冊", render: renderOnboardingPage },
        "#itinerary": { title: "行程規劃", render: renderItineraryPage },
        "#finance": { title: "財務分帳", render: renderFinancePage },
        "#map": { title: "地圖導航", render: renderMapPage },
        "#about": { title: "個人中心", render: renderAboutPage },
        "#login": { title: "身分認證", render: renderLoginPageView }
    };

    const route = routes[hash] || routes["#home"];
    APP_CONFIG.breadcrumb.innerText = route.title;
    route.render(APP_CONFIG.container, APP_STATE.currentUser);
    
    updateActiveNavigationStyles(hash);
}

// [其餘 UI 函數如 renderLoginPageView, updateGlobalSidebarUI 等保持不變...]

document.addEventListener("DOMContentLoaded", initializeApplication);
