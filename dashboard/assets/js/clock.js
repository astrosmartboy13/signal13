const Signal13Clock = (function () {
    let clockTimer = null;

    function formatDate(now) {
        return now.toLocaleDateString("id-ID", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric"
        });
    }

    function formatTime(now) {
        return now.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        });
    }

    function renderClock() {
        const now = new Date();
        const currentTime = document.getElementById("current-time");
        const currentDate = document.getElementById("current-date");
        const mobileCurrentTime = document.getElementById("mobile-current-time");
        const mobileCurrentDate = document.getElementById("mobile-current-date");

        if (currentDate) {
            currentDate.textContent = formatDate(now);
            currentDate.setAttribute("datetime", now.toISOString());
        }

        if (currentTime) {
            currentTime.textContent = formatTime(now);
            currentTime.setAttribute("datetime", now.toISOString());
        }

        if (mobileCurrentDate) {
            mobileCurrentDate.textContent = formatDate(now);
            mobileCurrentDate.setAttribute("datetime", now.toISOString());
        }

        if (mobileCurrentTime) {
            mobileCurrentTime.textContent = formatTime(now);
            mobileCurrentTime.setAttribute("datetime", now.toISOString());
        }
    }

    function initClock() {
        renderClock();
        clockTimer = window.setInterval(renderClock, 1000);
    }

    return {
        initClock: initClock,
        renderClock: renderClock,
        getTimer: function () {
            return clockTimer;
        }
    };
})();
