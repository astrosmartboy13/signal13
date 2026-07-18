const Signal13UI = (function () {
    function setText(id, value, fallback) {
        const element = document.getElementById(id);

        if (!element) {
            return;
        }

        element.textContent = value || fallback || "";
    }

    function setDateTime(id, value) {
        const element = document.getElementById(id);

        if (!element) {
            return;
        }

        element.setAttribute("datetime", value || "");
    }

    function normalizeStatus(status) {
        const value = String(status || "unknown").trim().toLowerCase();

        if (value === "online" || value === "live") {
            return "online";
        }

        if (value === "offline") {
            return "offline";
        }

        if (value === "warning") {
            return "warning";
        }

        return "unknown";
    }

    function setStatus(selector, status) {
        const element = document.querySelector(selector);

        if (!element) {
            return;
        }

        element.dataset.status = normalizeStatus(status);
    }

    return {
        setText: setText,
        setDateTime: setDateTime,
        normalizeStatus: normalizeStatus,
        setStatus: setStatus
    };
})();
