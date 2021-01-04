'use strict';

const express = require('express');
const os = require("os");

// Constants
const PORT = 8080;
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
  res.send('Hello World');
});

app.get('/version', routeMiddleware, (req, res) => {
  res.send(`Hello from Host ${os.hostname()} Process ${process.pid}. Code version: ${process.env.CODE_VERSION}`);
});

app.get('/airtable', routeMiddleware, (req, res) => {
  res.send(`Hello Airtable from Host ${os.hostname()} Process ${process.pid}`);
});

app.get('/2021', routeMiddleware, (req, res) => {
  res.send(`Hello 2021 from Host ${os.hostname()} Process ${process.pid}`);
});

app.get('/2022', routeMiddleware, (req, res) => {
  res.send(`Hello 2022 from Host ${os.hostname()} Process ${process.pid}`);
});

app.get('/2023', routeMiddleware, (req, res) => {
  res.send(`Hello 2023 from Host ${os.hostname()} Process ${process.pid}`);
});

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
logProcessInfo();
