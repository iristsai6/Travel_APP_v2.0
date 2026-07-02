// (地圖服務)：串接 Google Maps API、地標標記
/**
 * map.js
 * 負責 `#map` 路由。動態異步載入 Google Maps JavaScript API SDK，
 * 繪製自訂 Airbnb 風格地圖標籤（Marker）、串接點對點路徑導航繪製、並追蹤當前 GPS 定位。
 */

import { showToast } from "./utils.js";

let googleMapInstance = null;
let directionsRendererInstance = null;

/**
 * 地圖介面頁面初次載入渲染核心
 */
export async function renderMapPage(container, currentUser) {
    container.innerHTML = `
        <div class="w-full h-[calc(100vh-12rem)] relative rounded-3xl overflow-hidden shadow-inner border border-slate-200/50 dark:border-zinc-800/50 flex flex-col md:flex-row">
            <div class="w-full md:w-80 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md p-4 overflow-y-auto shrink-0 z-10 border-b md:border-b-0 md:border-r border-slate-200/50 dark:border-zinc-800/50 max-h-48 md:max-h-none">
                <h3 class="font-bold text-sm text-slate-400 mb-3 uppercase tracking-wider">當日導航路徑景點</h3>
                <div class="space-y-2" id="map-route-points-list">
                    <div class="p-3 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-xl text-xs font-semibold">📍 點位 1：築地市場 (起點)</div>
                    <div class="p-3 bg-slate-100 dark:bg-zinc-800 rounded-xl text-xs">📍 點位 2：東京鐵塔 (終點)</div>
                </div>
                <button id="trigger-route-draw-btn" class="w-full mt-4 py-2.5 bg-orange-500 text-white rounded-xl text-xs font-bold transition-transform hover:scale-[1.02]">繪製景點導航路徑</button>
            </div>

            <div id="google-maps-canvas" class="flex-1 h-full w-full bg-slate-200 dark:bg-zinc-800"></div>

            <button id="map-gps-locate-btn" class="absolute bottom-6 right-6 z-20 w-12 h-12 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl flex items-center justify-center border border-slate-200/50 dark:border-zinc-800/50 hover:scale-105 active:scale-95 transition-transform" aria-label="我的目前位置">
                🎯
            </button>
        </div>
    `;

    document.getElementById("trigger-route-draw-btn").addEventListener("click", drawItineraryRoute);
    document.getElementById("map-gps-locate-btn").addEventListener("click", trackCurrentUserLocation);

    // 啟動 Google Maps 非同步初始化掛載
    initGoogleMapsInstance();
}

/**
 * 非同步動態載入 Google Maps SDK 並建立地圖實例
 */
async function initGoogleMapsInstance() {
    const canvas = document.getElementById("google-maps-canvas");
    if (!canvas) return;

    // 暫代沙盒模擬，Phase 5 將完全替換為正式 google.maps 載入器
    if (typeof google === "undefined") {
        canvas.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-center p-6 space-y-2">
                <span class="text-4xl">🗺️</span>
                <p class="text-sm font-bold text-slate-500">Google Maps 區塊</p>
                <p class="text-xs text-slate-400 max-w-xs">將於 Phase 5 載入正式 Maps JavaScript SDK 與 Custom Markers 繪製。</p>
            </div>
        `;
        return;
    }

    // 正式實例初始化
    googleMapInstance = new google.maps.Map(canvas, {
        center: { lat: 35.65858, lng: 139.74543 }, // 預設東京鐵塔
        zoom: 14,
        disableDefaultUI: true,
        styles: [/* 融合之高級深色/極簡樣式設定 */]
    });

    const { DirectionsRenderer } = await google.maps.importLibrary("routes");
    directionsRendererInstance = new DirectionsRenderer();
    directionsRendererInstance.setMap(googleMapInstance);
}

/**
 * 依據當天多個行程景點座標串起並規劃繪製導航路線
 */
export async function drawItineraryRoute() {
    if (!googleMapInstance) {
        showToast("沙盒環境模擬：已為您重新計算並繪製最流暢的步行與地鐵導航路線！", "info");
        return;
    }
    // Phase 5 正式串接 google.maps.DirectionsService 繪製
}

/**
 * 利用 HTML5 Geolocation 獲取使用者當前精確 GPS 座標並在地圖上建立帶有呼吸燈之定位標記
 */
export function trackCurrentUserLocation() {
    if (!navigator.geolocation) {
        return showToast("您的瀏覽器不支援 GPS 定位服務功能。", "warning");
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            showToast(`GPS 定位成功！經度: ${longitude.toFixed(4)}, 緯度: ${latitude.toFixed(4)}`, "success");
            
            if (googleMapInstance) {
                googleMapInstance.setCenter({ lat: latitude, lng: longitude });
                googleMapInstance.setZoom(16);
                // 建立客製化呼吸燈定位點 Marker
            }
        },
        (error) => {
            showToast("無法獲取您當前的精確位置資訊，請檢查權限設定。", "error");
        }
    );
}
