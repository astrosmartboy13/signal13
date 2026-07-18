const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const path = require("path");

const app = express();

// ======================================================
// SIGNAL13 Dashboard
// ======================================================

app.use(
    "/dashboard",
    express.static(path.join(__dirname, "dashboard"))
);

// ======================================================
// SIGNAL13 API
// ======================================================

app.get("/health", (req, res) => {

    res.json({
        status: "online",
        server: "SIGNAL13",
        version: "3.0",
        target: "OnTime 4.9.0",
        time: new Date()
    });

});

app.get("/api/status", (req, res) => {

    res.json({
        signal13: true,
        dashboard: true,
        proxy: true,
        time: new Date()
    });

});

// ======================================================
// Reverse Proxy
// Semua route selain dashboard akan diteruskan ke OnTime
// ======================================================

const ontimeProxy = createProxyMiddleware({

    target: "http://127.0.0.1:4001",

    changeOrigin: true,

    ws: true,

    xfwd: true,

    logLevel: "debug"

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

app.listen(8080, () => {

console.log("");

console.log("========================================");

console.log(" SIGNAL13 Gateway v3.0");

console.log("========================================");

console.log("");

console.log("Dashboard : http://127.0.0.1:8080/dashboard/");

console.log("Timer     : http://127.0.0.1:8080/timer/");

console.log("Editor    : http://127.0.0.1:8080/editor/");

console.log("Backstage : http://127.0.0.1:8080/backstage/");

console.log("Timeline  : http://127.0.0.1:8080/timeline/");

console.log("Studio    : http://127.0.0.1:8080/studio/");

console.log("");

});