const Signal13App = (function () {
    function updateConnectionStatus() {
        const online = navigator.onLine;
        const currentStatus = online ? "ONLINE" : "OFFLINE";

        Signal13UI.setText("header-status-text", currentStatus, "OFFLINE");
        Signal13UI.setText("sidebar-status-text", currentStatus, "OFFLINE");
        Signal13UI.setText("status", currentStatus, "OFFLINE");
        Signal13UI.setText("liveStatus", currentStatus, "OFFLINE");

        Signal13UI.setStatus(".status-indicator", currentStatus);
        Signal13UI.setStatus("#header-status-dot", currentStatus);
        Signal13UI.setStatus("#sidebar-status-dot", currentStatus);
    }

    function bindOnlineEvents() {
        window.addEventListener("online", updateConnectionStatus);
        window.addEventListener("offline", updateConnectionStatus);
    }

    function initApp() {
        Signal13Clock.initClock();
        Signal13Dashboard.initDashboard();
        updateConnectionStatus();
        bindOnlineEvents();
    }

    return {
        initApp: initApp
    };
})();

document.addEventListener("DOMContentLoaded", function () {
    Signal13App.initApp();
});
