'use strict';

const http = require('http')
const options = {
  hostname: 'xue-test-service-blue-green-alb-382889407.us-west-2.elb.amazonaws.com',
  port: 80,
  path: '/version',
  method: 'GET'
}

console.log(`Running at time ${(new Date(Date.now())).toUTCString()} with code version ${process.env.CODE_VERSION}`);

const req = http.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`)

  res.on('data', d => {
    process.stdout.write(d)
  })
})

req.on('error', error => {
  console.error(error)
})

req.end()
