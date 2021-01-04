const GreetingType = {
    HELLO: "hello",
    HI: "hi",
}

const serverConfig = {
    greetingType: GreetingType.HI,
    showHostname: true,
    showProcessPid: true,
}

console.log(JSON.stringify(serverConfig));
