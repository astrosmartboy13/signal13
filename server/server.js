const express = require("express");
const path = require("path");

const app = express();

const PORT = 8080;

// ==========================================
// SIGNAL13 SERVER
// ==========================================

console.log("");
console.log("======================================");
console.log("        SIGNAL13 Server v2.0");
console.log("======================================");
console.log("");

// ==========================================
// DASHBOARD
// ==========================================

app.use(
    "/dashboard",
    express.static(path.join(__dirname, "..", "dashboard"))
);

// ==========================================
// HOME
// ==========================================

app.get("/", (req, res) => {

    res.send(`
<!DOCTYPE html>

<html>

<head>

<title>SIGNAL13 Server</title>

<style>

body{

font-family:Arial;
background:#111;
color:white;
padding:40px;

}

a{

display:block;
margin:15px 0;
font-size:20px;
color:#42b4ff;
text-decoration:none;

}

</style>

</head>

<body>

<h1>SIGNAL13 Server</h1>

<a href="/dashboard/">Dashboard</a>

<a href="/health">Health API</a>

<a href="/api/status">Status API</a>

</body>

</html>
`);

});

// ==========================================
// HEALTH API
// ==========================================

app.get("/health", (req, res) => {

    res.json({

        status: "online",

        server: "SIGNAL13",

        version: "2.0",

        ontime: "http://127.0.0.1:4001"

    });

});

// ==========================================
// STATUS API
// ==========================================

app.get("/api/status", (req, res) => {

    res.json({

        signal13: true,

        dashboard: true,

        ontime: true,

        version: "2.0",

        serverTime: new Date()

    });

});

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {

    console.log("Server Running");
    console.log("");

    console.log("Home      : http://127.0.0.1:8080/");
    console.log("Dashboard : http://127.0.0.1:8080/dashboard/");
    console.log("Health    : http://127.0.0.1:8080/health");
    console.log("Status    : http://127.0.0.1:8080/api/status");

    console.log("");

});