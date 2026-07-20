const Signal13Dashboard = (function () {
    const eventDataUrl = "assets/data/event.json";

    const fallbackData = {
        project: "Semesta On Stage",
        venue: "Venue TBA",
        eventDate: "",
        duration: "00:00:00",
        showDirector: "TBA",
        stageManager: "TBA",
        status: "ONLINE",
        rundownUrl: "",
        rundown: [],
        version: "2.0.0"
    };

    async function loadEventData() {
        const response = await fetch(eventDataUrl);

        if (!response.ok) {
            throw new Error("Event data failed to load");
        }

        return response.json();
    }

    function resolveQuickAccessUrl(key, data) {
        if (key === "rundown" && data.rundownUrl) {
            return data.rundownUrl;
        }

        if (!window.SIGNAL13 || !window.SIGNAL13[key]) {
            return "#";
        }

        const target = window.SIGNAL13[key];
        if (typeof target === "string" && target.startsWith("/")) {
            return target;
        }

        return getLink(target);
    }

    function formatShowDate(dateValue) {
        if (!dateValue) {
            return "-";
        }

        const date = new Date(dateValue);
        if (isNaN(date.getTime())) {
            return dateValue;
        }

        return date.toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "long",
            year: "numeric"
        });
    }

    function renderRundownItems(items) {
        const list = document.getElementById("rundown-list");
        if (!list) {
            return;
        }

        list.innerHTML = "";

        if (!Array.isArray(items) || items.length === 0) {
            const emptyItem = document.createElement("li");
            emptyItem.className = "rundown-item empty";
            emptyItem.textContent = "Rundown items are not available yet.";
            list.appendChild(emptyItem);
            return;
        }

        items.forEach(function (item) {
            const listItem = document.createElement("li");
            listItem.className = "rundown-item";
            listItem.dataset.start = item.start || "";

            const time = document.createElement("time");
            time.className = "rundown-time";
            time.textContent = item.start || item.time || "--:--";

            const content = document.createElement("div");
            content.className = "rundown-content";

            const title = document.createElement("h3");
            title.className = "rundown-title";
            title.textContent = item.title || "Untitled segment";

            const desc = document.createElement("p");
            desc.className = "rundown-desc";
            desc.textContent = item.description || "Detail rundown belum tersedia.";

            content.appendChild(title);
            content.appendChild(desc);
            listItem.appendChild(time);
            listItem.appendChild(content);
            list.appendChild(listItem);
        });
    }

    function renderQuickAccess(data) {
        const links = document.querySelectorAll("[data-link-key]");

        links.forEach(function (link) {
            const key = link.dataset.linkKey;
            const href = resolveQuickAccessUrl(key, data);

            link.setAttribute("href", href);

            if (href && href !== "#") {
                link.setAttribute("target", "_blank");
                link.setAttribute("rel", "noreferrer noopener");
            }
        });
    }

    function renderDashboard(data) {
        const eventData = Object.assign({}, fallbackData, data);

        Signal13UI.setText("event-name", eventData.project, fallbackData.project);
        Signal13UI.setText("project", eventData.project, fallbackData.project);
        Signal13UI.setText("project-title", eventData.project, fallbackData.project);
        Signal13UI.setText("venue", eventData.venue, fallbackData.venue);
        Signal13UI.setText("event-date", eventData.eventDate, "Date TBA");
        Signal13UI.setDateTime("event-date", eventData.eventDate);
        Signal13UI.setText("total-duration", eventData.duration, fallbackData.duration);
        Signal13UI.setText("duration", eventData.duration, fallbackData.duration);
        Signal13UI.setText("show-date", formatShowDate(eventData.eventDate), fallbackData.eventDate);
        Signal13UI.setText("director", eventData.showDirector, fallbackData.showDirector);
        Signal13UI.setText("show-director", eventData.showDirector, fallbackData.showDirector);
        Signal13UI.setText("stageManager", eventData.stageManager, fallbackData.stageManager);
        Signal13UI.setText("stage-manager", eventData.stageManager, fallbackData.stageManager);
        Signal13UI.setText("header-status-text", eventData.status, fallbackData.status);
        Signal13UI.setText("sidebar-status-text", eventData.status, fallbackData.status);
        Signal13UI.setText("status", eventData.status, fallbackData.status);
        Signal13UI.setText("liveStatus", eventData.status, fallbackData.status);
        Signal13UI.setText("system-version", eventData.version, fallbackData.version);

        Signal13UI.setStatus(".status-indicator", eventData.status);
        Signal13UI.setStatus("#header-status-dot", eventData.status);
        Signal13UI.setStatus("#sidebar-status-dot", eventData.status);
        Signal13UI.setStatus("#liveStatus", eventData.status);
        renderRundownItems(eventData.rundown || []);
        renderQuickAccess(eventData);
    }

    async function initDashboard() {
        try {
            const data = await loadEventData();
            renderDashboard(data);
        } catch (error) {
            renderDashboard(fallbackData);
            console.warn(error.message);
        }
    }

    return {
        initDashboard: initDashboard,
        renderDashboard: renderDashboard
    };
})();
