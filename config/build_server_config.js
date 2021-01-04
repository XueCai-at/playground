const GreetingType = {
    HELLO: "hello",
    HI: "hi",
}

const serverConfig = {
    greetingType: GreetingType.HI,
    showHostname: true,
    showProcessPid: false,
}

console.log(JSON.stringify(serverConfig));
