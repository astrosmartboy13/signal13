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

        return "unknown";
    }

    function setStatus(selector, status) {
        const elements = document.querySelectorAll(selector);

        if (!elements.length) {
            return;
        }

        elements.forEach(function (element) {
            element.dataset.status = normalizeStatus(status);
        });
    }

    function setTextBySelector(selector, value, fallback) {
        const elements = document.querySelectorAll(selector);

        if (!elements.length) {
            return;
        }

        elements.forEach(function (element) {
            element.textContent = value || fallback || "";
        });
    }

    function setShowStatus(selector, status) {
        const element = document.querySelector(selector);

        if (!element) {
            return;
        }

        element.dataset.status = String(status || "ready").trim().toLowerCase();
    }

    return {
        setText: setText,
        setTextBySelector: setTextBySelector,
        setDateTime: setDateTime,
        normalizeStatus: normalizeStatus,
        setStatus: setStatus,
        setShowStatus: setShowStatus
    };
})();
