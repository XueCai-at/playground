'use strict';

const express = require('express');
const os = require("os");
const http = require('http');

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

// calls backend service
app.get('/greeting', routeMiddleware, (req, res) => {
  const options = {
    hostname: 'xue-test-backend',  // k8s service discovery hostname, port is mapped to 80
    // hostname: 'localhost',
    // port: 5000,
    path: '/greeting',
    method: 'GET'
  }
  const backendReq = http.request(options, backendRes => {
    console.log(`Backend service returns statusCode: ${backendRes.statusCode}`)

    let data = '';
    backendRes.on('data', chunk => {
      data += chunk;
    })

    backendRes.on('end', () => {
      res.send(JSON.stringify(data));
    })
  })
  backendReq.on('error', error => {
    res.status(500).send(`Backend service returned error: ${JSON.stringify(error)}`);
  })
  backendReq.end();
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

app.get('/2024', routeMiddleware, (req, res) => {
  res.send(`Hello 2024 from Host ${os.hostname()} Process ${process.pid}`);
});

app.get('/martin', routeMiddleware, (req, res) => {
  res.send(`Hello martin from Host ${os.hostname()} Process ${process.pid}`);
});

app.get('/doci', routeMiddleware, (req, res) => {
  res.send(`Hello doci from Host ${os.hostname()} Process ${process.pid}`);
});

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
logProcessInfo();
