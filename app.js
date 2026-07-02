import { renderHomePage } from "./home.js";
import { renderItineraryPage } from "./itinerary.js";
import { renderMapPage } from "./map.js";
import { renderFinancePage } from "./finance.js";

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
