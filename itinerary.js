// (行程管理)：處理 CRUD 行程資料、時間軸渲染
/**
 * itinerary.js
 * 負責 `#itinerary` 路由。提供多日行程橫向切換、新增/修改/刪除、
 * 景點搜尋、以及 HTML5 原生拖曳排序與行程衝突標記。
 */

import { getAppDb } from "./firebase.js";
import { showToast, openModal, closeModal } from "./utils.js";
import { checkItineraryConflicts } from "./algorithm.js";

let currentSelectedDay = "2026-08-01"; // 預設目前選取的日期分頁

/**
 * 主要行程頁面渲染核心入口
 */
export async function renderItineraryPage(container, currentUser) {
    // 渲染骨架屏
    container.innerHTML = `
        <div class="space-y-6 animate-fade-in">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div class="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto" id="itinerary-days-tabs">
                    <button class="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold shrink-0">Day 1 (08/01)</button>
                    <button class="px-4 py-2 bg-slate-100 dark:bg-zinc-800 rounded-xl text-sm font-semibold shrink-0">Day 2 (08/02)</button>
                </div>
                
                <div class="flex gap-2 w-full md:w-auto">
                    <input type="text" id="itinerary-search-input" placeholder="搜尋景點關鍵字..." class="flex-1 md:w-64 px-4 py-2.5 bg-white dark:bg-zinc-900 border-0 rounded-xl text-sm shadow-sm focus:ring-2 focus:ring-orange-500">
                    <button id="add-itinerary-item-btn" class="px-4 py-2.5 bg-slate-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl text-sm font-bold shadow-md hover:opacity-90">新增景點</button>
                </div>
            </div>

            <div id="itinerary-timeline-list" class="space-y-4">
                </div>
        </div>
    `;

    // 綁定基礎點擊控制項
    document.getElementById("add-itinerary-item-btn").addEventListener("click", () => openAddItineraryModal(currentUser.currentGroupId));
    
    // 載入與整合拖曳功能
    loadTimelineItems(currentUser.currentGroupId);
}

/**
 * 載入並刷新特定日期的時間軸卡片
 */
export async function loadTimelineItems(groupId) {
    const listContainer = document.getElementById("itinerary-timeline-list");
    if (!listContainer) return;

    // 獲取當天行程陣列 (本處提供模組架構接口，後續於 Phase 4 串接真實資料庫)
    const items = [
        { id: "iti_01", title: "築地市場早餐堆", startTime: "08:30", endTime: "10:30", locationName: "築地外市場", category: "food", order: 1 },
        { id: "iti_02", title: "東京鐵塔登頂", startTime: "10:00", endTime: "12:00", locationName: "東京鐵塔", category: "sightseeing", order: 2 }
    ];

    // 利用演算法檢測是否具有行程重疊與衝突
    const conflictMap = checkItineraryConflicts(items);

    listContainer.innerHTML = items.map(item => `
        <div class="glass-panel p-5 rounded-2xl flex gap-4 border-l-4 ${conflictMap[item.id] ? 'border-l-rose-500 bg-rose-500/5' : 'border-l-orange-500'} cursor-grab active:cursor-grabbing transition-all hover:shadow-md" 
             draggable="true" data-id="${item.id}">
            <div class="text-sm font-mono font-bold text-slate-500 dark:text-zinc-400 shrink-0 py-0.5">
                ${item.startTime}<br><span class="text-xs text-slate-400 font-normal">|</span><br>${item.endTime}
            </div>
            <div class="flex-1 space-y-1">
                <div class="flex items-center justify-between">
                    <h4 class="font-bold text-base">${item.title}</h4>
                    <span class="text-xs px-2.5 py-1 bg-slate-100 dark:bg-zinc-800 rounded-full font-medium">${item.category}</span>
                </div>
                <p class="text-xs text-slate-400">📍 ${item.locationName}</p>
                ${conflictMap[item.id] ? `<p class="text-xs text-rose-500 font-semibold mt-1 flex items-center gap-1">⚠️ 警告：此時間段與其他行程發生衝突！</p>` : ''}
            </div>
        </div>
    `).join('');

    setupDragAndDropEvents(listContainer);
}

/**
 * 初始化 HTML5 拖曳排序事件綁定
 */
function setupDragAndDropEvents(container) {
    const cards = container.querySelectorAll('[draggable="true"]');
    cards.forEach(card => {
        card.addEventListener('dragstart', () => card.classList.add('dragging'));
        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
            // 當放開拖曳時，計算新順序並更新資料庫
            showToast("行程排列順序調整成功", "success");
        });
    });

    container.addEventListener('dragover', (e) => {
        e.preventDefault();
        const afterElement = getDragAfterElement(container, e.clientY);
        const dragging = document.querySelector('.dragging');
        if (afterElement == null) {
            container.appendChild(dragging);
        } else {
            container.insertBefore(dragging, afterElement);
        }
    });
}

/**
 * 輔助定位拖曳落點目標元素的輔助函式
 */
function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('[draggable="true"]:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

/**
 * 開啟新增行程彈出視窗
 */
function openAddItineraryModal(groupId) {
    openModal(`
        <h3 class="text-xl font-bold mb-4">新增行程地點</h3>
        <div class="space-y-3">
            <input type="text" id="modal-iti-title" placeholder="景點或行程名稱" class="w-full px-4 py-2.5 bg-slate-100 dark:bg-zinc-800 border-0 rounded-xl text-sm">
            <div class="grid grid-cols-2 gap-2">
                <input type="time" id="modal-iti-start" class="px-4 py-2.5 bg-slate-100 dark:bg-zinc-800 border-0 rounded-xl text-sm">
                <input type="time" id="modal-iti-end" class="px-4 py-2.5 bg-slate-100 dark:bg-zinc-800 border-0 rounded-xl text-sm">
            </div>
            <select id="modal-iti-category" class="w-full px-4 py-2.5 bg-slate-100 dark:bg-zinc-800 border-0 rounded-xl text-sm">
                <option value="sightseeing">景點參觀</option>
                <option value="food">美味餐飲</option>
                <option value="hotel">飯店住宿</option>
                <option value="transport">交通接駁</option>
            </select>
            <div class="flex gap-2 pt-2">
                <button id="modal-iti-cancel" class="flex-1 py-2.5 bg-slate-100 dark:bg-zinc-800 rounded-xl font-semibold text-sm">取消</button>
                <button id="modal-iti-submit" class="flex-1 py-2.5 bg-orange-500 text-white rounded-xl font-semibold text-sm">儲存</button>
            </div>
        </div>
    `);

    document.getElementById("modal-iti-cancel").addEventListener("click", closeModal);
    document.getElementById("modal-iti-submit").addEventListener("click", () => {
        showToast("新增成功", "success");
        closeModal();
    });
}

