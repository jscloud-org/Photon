import Client, { ConnectionStates } from "../../src/client/client";

const PORT = process.env.SOCKET_PORT || 4000;

const client = new Client('ws://localhost:' + PORT);

client.onStateChanged((state, clientID, error) => {
    console.log('client connection status:', state);
    if (error)
        console.log(error)
    if (state === ConnectionStates.ACTIVE) {
        client.publish('ask', { ask: 'data' });
    }

})

