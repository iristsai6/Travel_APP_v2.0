import { renderHomePage } from "./home.js";
import { renderItineraryPage } from "./itinerary.js";
import { renderMapPage } from "./map.js";
import { renderFinancePage } from "./finance.js";

const routes = {
    "#home": renderHomePage,
    "#itinerary": renderItineraryPage,
    "#map": renderMapPage,
    "#finance": renderFinancePage
};

function router() {
    const hash = window.location.hash || "#home";
    const container = document.getElementById("app-root");
    if (routes[hash]) routes[hash](container);
}

window.addEventListener("hashchange", router);
window.addEventListener("load", router);
