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
    console.log(`Process env: ${JSON.stringify(process.env, null, 4)}`);
    console.log(`Process argv: ${JSON.stringify(process.argv, null, 4)}`);
}
function routeMiddleware(req, res, next) {
    console.log(`Host ${os.hostname()} Process ${process.pid} got a request on route ${req.path}`);
    console.log(`Process resource usage: ${JSON.stringify(process.resourceUsage(), null, 4)}`);
    next();
}

app.get('/', routeMiddleware, (req, res) => {
  res.send('Hello World');
});

app.get('/airtable', routeMiddleware, (req, res) => {
  res.send('Hello Airtable');
});

app.get('/liutas', routeMiddleware, (req, res) => {
  res.send('Hello Liutas');
});

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
logProcessInfo();
