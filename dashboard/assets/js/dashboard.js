const Signal13Dashboard = (function () {
    const eventDataUrl = "assets/data/event.json";

    const fallbackData = {
        project: "SIGNAL13 Production Operating System",
        venue: "Venue TBA",
        eventDate: "",
        duration: "00:00:00",
        showDirector: "TBA",
        stageManager: "TBA",
        status: "ONLINE",
        rundownUrl: "",
        version: "0.1.0"
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

        return getLink(window.SIGNAL13[key]);
    }

    function renderQuickAccess(data) {
        const links = document.querySelectorAll("[data-link-key]");

        links.forEach(function (link) {
            const key = link.dataset.linkKey;
            const href = resolveQuickAccessUrl(key, data);

            link.setAttribute("href", href);

            if (href.startsWith("http")) {
                link.setAttribute("target", "_blank");
                link.setAttribute("rel", "noreferrer");
            }
        });
    }

    function renderDashboard(data) {
        const eventData = Object.assign({}, fallbackData, data);

        Signal13UI.setText("event-name", eventData.project, fallbackData.project);
        Signal13UI.setText("project", eventData.project, fallbackData.project);
        Signal13UI.setText("venue", eventData.venue, fallbackData.venue);
        Signal13UI.setText("event-date", eventData.eventDate, "Date TBA");
        Signal13UI.setDateTime("event-date", eventData.eventDate);
        Signal13UI.setText("duration", eventData.duration, fallbackData.duration);
        Signal13UI.setText("director", eventData.showDirector, fallbackData.showDirector);
        Signal13UI.setText("stageManager", eventData.stageManager, fallbackData.stageManager);
        Signal13UI.setText("status", eventData.status, fallbackData.status);
        Signal13UI.setText("liveStatus", eventData.status, fallbackData.status);
        Signal13UI.setText("system-version", eventData.version, fallbackData.version);

        Signal13UI.setStatus(".status-indicator", eventData.status);
        Signal13UI.setStatus("#liveStatus", eventData.status);
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
