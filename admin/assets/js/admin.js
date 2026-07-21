(function () {
    const fields = [
        "project",
        "venue",
        "eventDate",
        "duration",
        "showDirector",
        "stageManager",
        "showStatus",
        "rundownUrl",
        "productionDocsUrl",
        "instagramUrl"
    ];
    const form = document.getElementById("event-form");
    const saveButton = document.getElementById("save-button");
    const reloadButton = document.getElementById("reload-button");
    const statusText = document.getElementById("status-text");
    const summary = document.getElementById("form-summary");
    let snapshot = {};
    let dirty = false;

    function setStatus(state, label) {
        statusText.dataset.state = state;
        statusText.textContent = label;
    }

    function formData() {
        return fields.reduce(function (data, field) {
            const input = form.elements[field];
            data[field] = input ? input.value.trim() : "";
            return data;
        }, {});
    }

    function sameData(a, b) {
        return fields.every(function (field) {
            return (a[field] || "") === (b[field] || "");
        });
    }

    function setDirty(nextDirty) {
        dirty = nextDirty;
        saveButton.disabled = !dirty;
    }

    function clearErrors() {
        summary.textContent = "";
        fields.forEach(function (field) {
            const error = document.querySelector('[data-error-for="' + field + '"]');

            if (error) {
                error.textContent = "";
            }
        });
    }

    function showFieldErrors(errors) {
        clearErrors();

        Object.keys(errors || {}).forEach(function (field) {
            const error = document.querySelector('[data-error-for="' + field + '"]');

            if (error) {
                error.textContent = errors[field];
                return;
            }

            summary.textContent = errors[field];
        });
    }

    function fillForm(data) {
        fields.forEach(function (field) {
            const input = form.elements[field];

            if (input) {
                input.value = typeof data[field] === "string" ? data[field] : "";
            }
        });
    }

    async function requestJson(url, options) {
        const response = await fetch(url, options);
        const data = await response.json();

        if (!response.ok) {
            const message = data && data.error ? data.error.message : "Request failed";
            const error = new Error(message);
            error.response = data;
            throw error;
        }

        return data;
    }

    async function loadEvent() {
        setStatus("loading", "Loading");
        clearErrors();

        try {
            const data = await requestJson("/api/event", {
                headers: {
                    "Accept": "application/json"
                }
            });

            snapshot = Object.assign({}, data);
            fillForm(snapshot);
            setDirty(false);
            setStatus("ready", "Ready");
        } catch (error) {
            setStatus("error", "Error");
            summary.textContent = error.message;
        }
    }

    async function saveEvent() {
        const data = formData();

        setStatus("saving", "Saving");
        clearErrors();

        try {
            const result = await requestJson("/api/event", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(data)
            });

            snapshot = Object.assign({}, result.event || data);
            fillForm(snapshot);
            setDirty(false);
            setStatus("saved", "Saved");
        } catch (error) {
            setStatus("error", "Error");

            if (error.response && error.response.error && error.response.error.fields) {
                showFieldErrors(error.response.error.fields);
            } else {
                summary.textContent = error.message;
            }
        }
    }

    form.addEventListener("input", function () {
        setDirty(!sameData(formData(), snapshot));
    });

    reloadButton.addEventListener("click", function () {
        if (dirty && !window.confirm("Discard unsaved changes?")) {
            return;
        }

        loadEvent();
    });

    saveButton.addEventListener("click", saveEvent);

    window.addEventListener("beforeunload", function (event) {
        if (!dirty) {
            return;
        }

        event.preventDefault();
        event.returnValue = "";
    });

    loadEvent();
})();
