const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const fs = require("fs");
const http = require("http");
const https = require("https");
const path = require("path");

const app = express();

const GATEWAY_VERSION = "3.0";
const PORT = Number(process.env.PORT || 8080);
const ONTIME_BASE_URL = "http://127.0.0.1:4001";
const STATUS_TIMEOUT_MS = 1200;
const EVENT_CONFIG_PATH = path.join(__dirname, "dashboard", "assets", "data", "event.json");
const EVENT_BODY_LIMIT = "32kb";
const STATUS = {
    ONLINE: "online",
    OFFLINE: "offline",
    UNKNOWN: "unknown"
};
const SHOW_STATUS_VALUES = ["PRE-SHOW", "READY", "LIVE", "BREAK", "FINISHED"];
const EVENT_EDITABLE_FIELDS = [
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
const FORBIDDEN_EVENT_FIELDS = [
    "status",
    "systemStatus",
    "gateway",
    "dashboard",
    "ontime",
    "tunnel",
    "launcher",
    "editor",
    "overall",
    "lastChecked"
];
const POLLUTION_KEYS = ["__proto__", "prototype", "constructor"];
let eventWriteLock = Promise.resolve();

app.use(express.json({ limit: EVENT_BODY_LIMIT }));

// ======================================================
// Runtime Status Normalizer
// ======================================================

function normalizeStatus(value) {
    const normalized = String(value || STATUS.UNKNOWN).trim().toLowerCase();

    if (normalized === STATUS.ONLINE || normalized === "true" || normalized === "ok" || normalized === "ready") {
        return STATUS.ONLINE;
    }

    if (normalized === STATUS.OFFLINE || normalized === "false" || normalized === "down" || normalized === "error") {
        return STATUS.OFFLINE;
    }

    return STATUS.UNKNOWN;
}

function normalizeServiceStatus(result) {
    if (!result || typeof result !== "object") {
        return STATUS.UNKNOWN;
    }

    return normalizeStatus(result.status);
}

// ======================================================
// Runtime Collector
// ======================================================

function requestUrl(targetUrl, timeoutMs = STATUS_TIMEOUT_MS) {
    return new Promise((resolve) => {
        const client = targetUrl.startsWith("https:") ? https : http;
        const request = client.request(targetUrl, { method: "GET", timeout: timeoutMs }, (response) => {
            response.resume();
            response.on("end", () => {
                resolve({
                    ok: response.statusCode >= 200 && response.statusCode < 500,
                    statusCode: response.statusCode
                });
            });
        });

        request.on("timeout", () => {
            request.destroy();
            resolve({ ok: false, error: "timeout" });
        });

        request.on("error", (error) => {
            resolve({ ok: false, error: error.code || error.message });
        });

        request.end();
    });
}

async function collectGatewayStatus() {
    return {
        status: STATUS.ONLINE
    };
}

async function collectDashboardStatus() {
    const indexPath = path.join(__dirname, "dashboard", "index.html");

    try {
        await fs.promises.access(indexPath, fs.constants.R_OK);
        return { status: STATUS.ONLINE };
    } catch (error) {
        return { status: STATUS.OFFLINE, error: "dashboard index not readable" };
    }
}

async function collectOnTimeStatus() {
    const result = await requestUrl(ONTIME_BASE_URL + "/");

    if (result.ok) {
        return { status: STATUS.ONLINE, statusCode: result.statusCode };
    }

    return { status: STATUS.OFFLINE, error: result.error || "unreachable" };
}

async function collectEditorStatus(ontimeStatus) {
    if (normalizeServiceStatus(ontimeStatus) === STATUS.OFFLINE) {
        return { status: STATUS.OFFLINE, dependency: "ontime" };
    }

    if (normalizeServiceStatus(ontimeStatus) === STATUS.UNKNOWN) {
        return { status: STATUS.UNKNOWN, dependency: "ontime" };
    }

    const result = await requestUrl(ONTIME_BASE_URL + "/editor/");

    if (result.ok) {
        return { status: STATUS.ONLINE, statusCode: result.statusCode };
    }

    return { status: STATUS.OFFLINE, error: result.error || "unreachable" };
}

async function collectTunnelStatus() {
    return {
        status: STATUS.UNKNOWN,
        reason: "tunnel status hook not implemented"
    };
}

async function collectLauncherStatus() {
    return {
        status: STATUS.UNKNOWN,
        reason: "launcher status hook not implemented"
    };
}

async function collectRuntimeStatus() {
    const [dashboard, gateway, ontime, tunnel, launcher] = await Promise.all([
        collectDashboardStatus(),
        collectGatewayStatus(),
        collectOnTimeStatus(),
        collectTunnelStatus(),
        collectLauncherStatus()
    ]);
    const editor = await collectEditorStatus(ontime);

    return {
        dashboard,
        gateway,
        ontime,
        tunnel,
        launcher,
        editor
    };
}

// ======================================================
// Response Builder
// ======================================================

function calculateOverallStatus(services) {
    const gateway = normalizeServiceStatus(services.gateway);
    const dashboard = normalizeServiceStatus(services.dashboard);
    const ontime = normalizeServiceStatus(services.ontime);

    if (gateway === STATUS.OFFLINE || dashboard === STATUS.OFFLINE || ontime === STATUS.OFFLINE) {
        return STATUS.OFFLINE;
    }

    if (gateway === STATUS.ONLINE && dashboard === STATUS.ONLINE && ontime === STATUS.ONLINE) {
        return STATUS.ONLINE;
    }

    return STATUS.UNKNOWN;
}

function buildStatusResponse(services) {
    const normalizedServices = {
        dashboard: normalizeServiceStatus(services.dashboard),
        gateway: normalizeServiceStatus(services.gateway),
        ontime: normalizeServiceStatus(services.ontime),
        tunnel: normalizeServiceStatus(services.tunnel),
        launcher: normalizeServiceStatus(services.launcher),
        editor: normalizeServiceStatus(services.editor)
    };

    return {
        overall: calculateOverallStatus(services),
        dashboard: normalizedServices.dashboard,
        gateway: normalizedServices.gateway,
        ontime: normalizedServices.ontime,
        tunnel: normalizedServices.tunnel,
        launcher: normalizedServices.launcher,
        editor: normalizedServices.editor,
        time: new Date().toISOString(),
        version: GATEWAY_VERSION
    };
}

// ======================================================
// Admin Event Configuration
// WARNING: Write endpoints are not production-safe without authentication.
// ======================================================

function buildError(code, message, fields = {}) {
    return {
        ok: false,
        error: {
            code,
            message,
            fields
        }
    };
}

function isPlainObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasUnsafeKey(payload) {
    return Object.keys(payload).some((key) => POLLUTION_KEYS.includes(key));
}

async function readEventConfig() {
    const raw = await fs.promises.readFile(EVENT_CONFIG_PATH, "utf8");
    return JSON.parse(raw);
}

function validateStringField(payload, field, options = {}) {
    const fields = {};
    const value = payload[field];

    if (value === undefined) {
        if (options.required) {
            fields[field] = "Field is required";
        }

        return { fields };
    }

    if (typeof value !== "string") {
        fields[field] = "Must be a string";
        return { fields };
    }

    const trimmed = value.trim();

    if (options.required && !trimmed) {
        fields[field] = "Cannot be empty";
    }

    return {
        fields,
        value: trimmed
    };
}

function isValidDateString(value) {
    if (!value) {
        return true;
    }

    const date = new Date(value);
    return !Number.isNaN(date.getTime());
}

function isValidHttpUrl(value) {
    if (!value) {
        return true;
    }

    try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch (error) {
        return false;
    }
}

function validateEventPayload(payload) {
    const errors = {};
    const sanitized = {};

    if (!isPlainObject(payload)) {
        return {
            ok: false,
            errors: {
                payload: "Payload must be a JSON object"
            }
        };
    }

    if (hasUnsafeKey(payload)) {
        return {
            ok: false,
            errors: {
                payload: "Payload contains reserved keys"
            }
        };
    }

    Object.keys(payload).forEach((key) => {
        if (FORBIDDEN_EVENT_FIELDS.includes(key)) {
            errors[key] = "Runtime fields cannot be written to event config";
            return;
        }

        if (!EVENT_EDITABLE_FIELDS.includes(key)) {
            errors[key] = "Unsupported field";
        }
    });

    EVENT_EDITABLE_FIELDS.forEach((field) => {
        const required = field === "project";
        const result = validateStringField(payload, field, { required });

        Object.assign(errors, result.fields);

        if (result.value !== undefined) {
            sanitized[field] = result.value;
        }
    });

    if (sanitized.eventDate !== undefined && !isValidDateString(sanitized.eventDate)) {
        errors.eventDate = "Must be a valid date string or empty";
    }

    if (sanitized.showStatus !== undefined) {
        sanitized.showStatus = sanitized.showStatus.toUpperCase();

        if (!SHOW_STATUS_VALUES.includes(sanitized.showStatus)) {
            errors.showStatus = "Must be one of " + SHOW_STATUS_VALUES.join(", ");
        }
    }

    ["rundownUrl", "productionDocsUrl", "instagramUrl"].forEach((field) => {
        if (sanitized[field] !== undefined && !isValidHttpUrl(sanitized[field])) {
            errors[field] = "Must be an http/https URL or empty";
        }
    });

    return {
        ok: Object.keys(errors).length === 0,
        errors,
        value: sanitized
    };
}

function mergeEventConfig(existingConfig, sanitizedConfig) {
    const nextConfig = {};

    Object.keys(existingConfig).forEach((key) => {
        if (POLLUTION_KEYS.includes(key) || FORBIDDEN_EVENT_FIELDS.includes(key)) {
            return;
        }

        nextConfig[key] = existingConfig[key];
    });

    EVENT_EDITABLE_FIELDS.forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(sanitizedConfig, field)) {
            nextConfig[field] = sanitizedConfig[field];
        }
    });

    return nextConfig;
}

async function writeJsonAtomic(filePath, data) {
    const dir = path.dirname(filePath);
    const tempPath = path.join(dir, ".event." + process.pid + "." + Date.now() + ".tmp");
    const json = JSON.stringify(data, null, 2) + "\n";

    JSON.parse(json);
    await fs.promises.writeFile(tempPath, json, "utf8");
    await fs.promises.rename(tempPath, filePath);
}

function enqueueEventWrite(task) {
    eventWriteLock = eventWriteLock.then(task, task);
    return eventWriteLock;
}

// ======================================================
// SIGNAL13 Dashboard
// ======================================================

app.use(
    "/dashboard",
    express.static(path.join(__dirname, "dashboard"))
);

app.use(
    ["/admin", "/admin/"],
    express.static(path.join(__dirname, "admin"))
);

// ======================================================
// SIGNAL13 API
// ======================================================

app.get("/health", async (req, res) => {

    const gateway = await collectGatewayStatus();

    res.json({
        status: normalizeServiceStatus(gateway),
        server: "SIGNAL13",
        service: "gateway",
        version: GATEWAY_VERSION,
        time: new Date().toISOString()
    });

});

app.get("/api/status", async (req, res) => {

    const services = await collectRuntimeStatus();

    res.json(buildStatusResponse(services));

});

app.get("/api/event", async (req, res) => {

    try {
        const eventConfig = await readEventConfig();
        res.json(eventConfig);
    } catch (error) {
        res.status(500).json(buildError("EVENT_READ_ERROR", "Unable to read event configuration"));
    }

});

app.put("/api/event", async (req, res) => {

    if (!req.is("application/json")) {
        res.status(415).json(buildError("UNSUPPORTED_MEDIA_TYPE", "Content-Type must be application/json"));
        return;
    }

    const validation = validateEventPayload(req.body);

    if (!validation.ok) {
        res.status(400).json(buildError("VALIDATION_ERROR", "Event configuration is invalid", validation.errors));
        return;
    }

    try {
        const savedConfig = await enqueueEventWrite(async () => {
            const existingConfig = await readEventConfig();
            const nextConfig = mergeEventConfig(existingConfig, validation.value);

            await writeJsonAtomic(EVENT_CONFIG_PATH, nextConfig);
            return nextConfig;
        });

        res.json({
            ok: true,
            event: savedConfig
        });
    } catch (error) {
        res.status(500).json(buildError("EVENT_WRITE_ERROR", "Unable to save event configuration"));
    }

});

app.use((error, req, res, next) => {
    if (!error) {
        next();
        return;
    }

    if (error.type === "entity.too.large") {
        res.status(413).json(buildError("PAYLOAD_TOO_LARGE", "Request body is too large"));
        return;
    }

    if (error instanceof SyntaxError && Object.prototype.hasOwnProperty.call(error, "body")) {
        res.status(400).json(buildError("INVALID_JSON", "Request body must be valid JSON"));
        return;
    }

    res.status(400).json(buildError("BAD_REQUEST", "Request could not be processed"));
});

// ======================================================
// Reverse Proxy
// Semua route selain dashboard akan diteruskan ke OnTime
// ======================================================

const ontimeProxy = createProxyMiddleware({

    target: ONTIME_BASE_URL,

    changeOrigin: true,

    ws: true,

    xfwd: true,

    logLevel: "warn"

});

// ======================================================
// HOME
// ======================================================

app.get("/", (req, res) => {

res.send(`

<!DOCTYPE html>

<html>

<head>

<meta charset="utf-8">

<title>SIGNAL13 Gateway</title>

<style>

body{

background:#111;

color:white;

font-family:Arial;

padding:40px;

}

a{

display:block;

margin:12px 0;

font-size:22px;

color:#59b8ff;

text-decoration:none;

}

</style>

</head>

<body>

<h1>SIGNAL13 Gateway</h1>

<hr>

<a href="/dashboard/">Dashboard</a>

<a href="/admin/">Admin</a>

<a href="/timer/">Timer</a>

<a href="/editor/">Editor</a>

<a href="/backstage/">Backstage</a>

<a href="/timeline/">Timeline</a>

<a href="/studio/">Studio</a>

<hr>

<a href="/health">Health</a>

<a href="/api/status">Status</a>

</body>

</html>

`);

});

// ======================================================
// Reverse Proxy
// HARUS PALING BAWAH
// ======================================================

app.use("/", ontimeProxy);

// ======================================================

app.listen(PORT, () => {

console.log("");

console.log("========================================");

console.log(" SIGNAL13 Gateway v3.0");

console.log("========================================");

console.log("");

console.log(`Dashboard : http://127.0.0.1:${PORT}/dashboard/`);

console.log(`Timer     : http://127.0.0.1:${PORT}/timer/`);

console.log(`Editor    : http://127.0.0.1:${PORT}/editor/`);

console.log(`Backstage : http://127.0.0.1:${PORT}/backstage/`);

console.log(`Timeline  : http://127.0.0.1:${PORT}/timeline/`);

console.log(`Studio    : http://127.0.0.1:${PORT}/studio/`);

console.log("");

});
