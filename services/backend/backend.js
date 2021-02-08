'use strict';

const express = require('express');
const os = require("os");

// Constants
const PORT = 5000;
const HOST = '0.0.0.0';

// App
const app = express();

function logProcessInfo() {
    console.log(`Current directory: ${process.cwd()}`);
    console.log(`This processor architecture is ${process.arch}`);
    console.log(`This platform is ${process.platform}`);
    console.log(`Current gid: ${process.getegid()} ${process.getgid()}`);
    console.log(`Current uid: ${process.geteuid()} ${process.getuid()}`);
    console.log(`Process env: ${JSON.stringify(process.env)}`);
    console.log(`Process argv: ${JSON.stringify(process.argv)}`);
    console.log(`Process resource usage: ${JSON.stringify(process.resourceUsage())}`);
}
function routeMiddleware(req, res, next) {
    console.log(`Host ${os.hostname()} Process ${process.pid} got a request on route ${req.path}`);
    next();
}

app.get('/', (req, res) => {
  // uncomment to fail health checks
  // res.sendStatus(500);
  res.sendStatus(200);
});

app.get('/version', routeMiddleware, (req, res) => {
  res.send(`Backend service at Host ${os.hostname()} Process ${process.pid}. Code version: ${process.env.CODE_VERSION}`);
});

app.get('/greeting', routeMiddleware, (req, res) => {
  res.send(`Greeting from Backend service at Host ${os.hostname()} Process ${process.pid}`);
});

app.listen(PORT, HOST);
console.log(`Backend service running on http://${HOST}:${PORT}`);
logProcessInfo();
