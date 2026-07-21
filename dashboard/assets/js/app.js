const Signal13App = (function () {
    const pollIntervalMs = 15000;
    const requestTimeoutMs = 5000;
    let pollTimer = null;
    let requestInFlight = false;
    let lastWarning = "";

    const runtimeState = {
        dashboard: "unknown",
        gateway: "unknown",
        ontime: "unknown",
        tunnel: "unknown",
        overall: "unknown",
        lastChecked: null,
        errors: []
    };

    function runtimeEndpoints() {
        return {
            health: window.SIGNAL13 && window.SIGNAL13.health ? window.SIGNAL13.health : "/health",
            apiStatus: window.SIGNAL13 && window.SIGNAL13.apiStatus ? window.SIGNAL13.apiStatus : "/api/status"
        };
    }

    function statusLabel(status) {
        return Signal13UI.normalizeStatus(status).toUpperCase();
    }

    function statusSubtext(status) {
        const normalized = Signal13UI.normalizeStatus(status);

        if (normalized === "online") {
            return "All systems operational";
        }

        if (normalized === "offline") {
            return "System attention required";
        }

        return "Checking system status...";
    }

    function isPlainObject(value) {
        return value !== null && typeof value === "object" && !Array.isArray(value);
    }

    async function fetchJsonWithTimeout(url) {
        const controller = new AbortController();
        const timeout = window.setTimeout(function () {
            controller.abort();
        }, requestTimeoutMs);

        try {
            const response = await fetch(url, {
                cache: "no-store",
                signal: controller.signal
            });

            if (!response.ok) {
                throw new Error(url + " returned HTTP " + response.status);
            }

            return await response.json();
        } finally {
            window.clearTimeout(timeout);
        }
    }

    function normalizeRuntimeStatus(value) {
        if (typeof value === "boolean") {
            return value ? "online" : "offline";
        }

        if (isPlainObject(value)) {
            return normalizeRuntimeStatus(value.status || value.state || value.online);
        }

        return Signal13UI.normalizeStatus(value);
    }

    function resolveNestedStatus(data, keys) {
        for (let index = 0; index < keys.length; index += 1) {
            const key = keys[index];

            if (Object.prototype.hasOwnProperty.call(data, key)) {
                return normalizeRuntimeStatus(data[key]);
            }
        }

        return "unknown";
    }

    function resolveServiceStatus(data, serviceName) {
        if (!isPlainObject(data)) {
            return "unknown";
        }

        const direct = resolveNestedStatus(data, [serviceName, serviceName.toLowerCase()]);
        if (direct !== "unknown") {
            return direct;
        }

        if (isPlainObject(data.services)) {
            const fromServices = resolveNestedStatus(data.services, [serviceName, serviceName.toLowerCase()]);
            if (fromServices !== "unknown") {
                return fromServices;
            }
        }

        if (Array.isArray(data.services)) {
            const service = data.services.find(function (item) {
                return String(item.name || item.service || "").toLowerCase() === serviceName.toLowerCase();
            });

            if (service) {
                return normalizeRuntimeStatus(service.status || service.state || service.online);
            }
        }

        return "unknown";
    }

    function resolveOnTimeStatus(apiStatus) {
        const explicit = resolveServiceStatus(apiStatus, "ontime");
        if (explicit !== "unknown") {
            return explicit;
        }

        if (Object.prototype.hasOwnProperty.call(apiStatus, "onTime")) {
            return normalizeRuntimeStatus(apiStatus.onTime);
        }

        if (Object.prototype.hasOwnProperty.call(apiStatus, "ontimeStatus")) {
            return normalizeRuntimeStatus(apiStatus.ontimeStatus);
        }

        if (apiStatus.proxy === true) {
            return "offline";
        }

        return "unknown";
    }

    function resolveTunnelStatus(apiStatus) {
        const explicit = resolveServiceStatus(apiStatus, "tunnel");

        if (explicit !== "unknown") {
            return explicit;
        }

        if (Object.prototype.hasOwnProperty.call(apiStatus, "tunnelStatus")) {
            return normalizeRuntimeStatus(apiStatus.tunnelStatus);
        }

        return "unknown";
    }

    function resolveOverallStatus(nextState) {
        if (nextState.gateway === "offline" || nextState.ontime === "offline") {
            return "offline";
        }

        if (nextState.dashboard === "online" && nextState.gateway === "online") {
            return "online";
        }

        return "unknown";
    }

    function applyRuntimeState(nextState) {
        Object.assign(runtimeState, nextState);

        const overall = Signal13UI.normalizeStatus(runtimeState.overall);
        const label = statusLabel(overall);
        const subtext = statusSubtext(overall);

        Signal13UI.setTextBySelector("#header-status-text, #sidebar-status-text, #mobile-time-status-text, #mobile-status-text", label, "UNKNOWN");
        Signal13UI.setTextBySelector("#sidebar-status-sub, #mobile-status-sub", subtext, "Checking system status...");
        Signal13UI.setText("status", label, "UNKNOWN");
        Signal13UI.setText("liveStatus", label, "UNKNOWN");

        Signal13UI.setStatus(".status-indicator, #header-status-dot, #sidebar-status-dot, #mobile-time-status-dot, #mobile-status-dot, #liveStatus", overall);
        applyOnTimeRouteState(runtimeState.ontime);
    }

    function applyOnTimeRouteState(ontimeStatus) {
        const normalized = Signal13UI.normalizeStatus(ontimeStatus);
        const keys = ["stageTimer", "backstage", "timeline", "studio", "editor"];

        keys.forEach(function (key) {
            const links = document.querySelectorAll('[data-link-key="' + key + '"]');

            links.forEach(function (link) {
                link.dataset.status = normalized;
                link.setAttribute("aria-label", link.textContent.trim() + " - OnTime " + statusLabel(normalized));
            });
        });
    }

    function warnOnce(message) {
        if (message === lastWarning) {
            return;
        }

        lastWarning = message;
        console.warn(message);
    }

    async function refreshRuntimeStatus() {
        if (requestInFlight || document.hidden) {
            return runtimeState;
        }

        requestInFlight = true;

        const nextState = {
            dashboard: "online",
            gateway: "unknown",
            ontime: "unknown",
            tunnel: "unknown",
            overall: "unknown",
            lastChecked: new Date().toISOString(),
            errors: []
        };

        const endpoints = runtimeEndpoints();

        try {
            const health = await fetchJsonWithTimeout(endpoints.health);
            nextState.gateway = isPlainObject(health) && Signal13UI.normalizeStatus(health.status) === "online" ? "online" : "offline";
        } catch (error) {
            nextState.gateway = "offline";
            nextState.errors.push({ endpoint: endpoints.health, message: error.message });
        }

        try {
            const apiStatus = await fetchJsonWithTimeout(endpoints.apiStatus);

            if (isPlainObject(apiStatus)) {
                const dashboardStatus = resolveServiceStatus(apiStatus, "dashboard");
                nextState.dashboard = dashboardStatus === "unknown" ? "online" : dashboardStatus;
                nextState.ontime = resolveOnTimeStatus(apiStatus);
                nextState.tunnel = resolveTunnelStatus(apiStatus);
            } else {
                nextState.ontime = "unknown";
                nextState.tunnel = "unknown";
                nextState.errors.push({ endpoint: endpoints.apiStatus, message: "Invalid status payload" });
            }
        } catch (error) {
            nextState.ontime = "unknown";
            nextState.tunnel = "unknown";
            nextState.errors.push({ endpoint: endpoints.apiStatus, message: error.message });
        }

        nextState.overall = resolveOverallStatus(nextState);
        applyRuntimeState(nextState);

        if (nextState.errors.length) {
            warnOnce("Runtime status check warning: " + nextState.errors.map(function (item) {
                return item.endpoint + " " + item.message;
            }).join("; "));
        } else {
            lastWarning = "";
        }

        requestInFlight = false;
        return runtimeState;
    }

    function startPolling() {
        stopPolling();
        refreshRuntimeStatus();

        pollTimer = window.setInterval(refreshRuntimeStatus, pollIntervalMs);
    }

    function stopPolling() {
        if (!pollTimer) {
            return;
        }

        window.clearInterval(pollTimer);
        pollTimer = null;
    }

    function bindVisibilityEvents() {
        document.addEventListener("visibilitychange", function () {
            if (document.hidden) {
                stopPolling();
                return;
            }

            startPolling();
        });
    }

    function initApp() {
        applyRuntimeState(runtimeState);
        Signal13Clock.initClock();
        Signal13Dashboard.initDashboard();
        bindVisibilityEvents();
        startPolling();
    }

    return {
        initApp: initApp,
        refreshRuntimeStatus: refreshRuntimeStatus,
        getRuntimeState: function () {
            return Object.assign({}, runtimeState);
        }
    };
})();

window.Signal13App = Signal13App;

document.addEventListener("DOMContentLoaded", function () {
    Signal13App.initApp();
});
