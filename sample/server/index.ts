import Hub from "../../src/server/hub";

const port = parseInt(process.env.SOCKET_PORT || '4000');

Hub.init(port);