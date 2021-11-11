import EventEmitter from "events";
import WebSocket from "ws";
import { log } from "../common/Logger";
import MessagePayload, { createBroadcastMessage, createEventMessage, createEventRegMessage } from "../common/MessagePayload";
import ClientNotActive from "./Errors/ClientNotActive";
import EventMessageHandler from "./MessageHandler/EventMessageHandler";
import MessageHandler from "./MessageHandler/MessageHandler";

export enum ConnectionStates {
    OPEN,
    ACTIVE,
    INACTIVE,
    CLOSED
}


export class Client {

    private connState: ConnectionStates;
    private clientSocket: WebSocket;
    private stateChangeCallback: (state: ConnectionStates, clientId: string | null, error?: Error) => void;
    private messageHandler: MessageHandler
    private eventEmitter: EventEmitter;
    private clientId: string | null;

    URL: string

    constructor(URL: string) {
        log('Initializing new socket client...')
        this.URL = URL
        this.clientSocket = new WebSocket(URL);
        this.eventEmitter = new EventEmitter();
        this.messageHandler = new EventMessageHandler(this.eventEmitter);
        this.clientId = null;
        this.stateChangeCallback = () => { };
        this.attachDefaultListeners();
        this.connState = ConnectionStates.CLOSED;
    }


    public disconnect() {
        this.clientSocket && this.clientSocket.close();
    }

    public connect() {
        this.clientSocket = new WebSocket(this.URL);
    }


    public onStateChanged(cb: (state: ConnectionStates, clientId: string | null, error?: Error) => void) {
        this.stateChangeCallback = cb;
    }

    public publish(event: string, payload: any) {
        if (this.connState !== ConnectionStates.ACTIVE)
            throw new ClientNotActive();
        const message: MessagePayload = createEventMessage(event, payload, this.clientId || '');
        this.send(message);
    }

    public on(event: string, cb: (...args: any[]) => void) {
        if (this.connState !== ConnectionStates.ACTIVE)
            throw new ClientNotActive();
        this.registerEventOnServer(event);
        this.eventEmitter.on(event, cb)
    }

    public broadcast(payload: any) {
        if (this.connState !== ConnectionStates.ACTIVE)
            throw new ClientNotActive();
        const mp = createBroadcastMessage(payload, this.clientId || '');
        this.send(mp);
    }

    private send(msg: any) {
        if (!(msg instanceof String))
            this.clientSocket.send(JSON.stringify(msg));
        else
            this.clientSocket.send(msg, log);
    }

    private registerEventOnServer(event: string) {
        const mp = createEventRegMessage(event, this.clientId || '');
        this.send(mp)
    }

    public forward(msg: string | object) {
        if (this.connState !== ConnectionStates.ACTIVE)
            throw new ClientNotActive();
        this.send(msg)
    }

    public getState() {
        return this.connState;
    }

    private attachDefaultListeners() {
        log('attaching default listeners...')
        this.clientSocket.on('open', () => {
            // log('Connection Open', 'info');
            this.connState = ConnectionStates.OPEN;
            this.stateChangeCallback(ConnectionStates.OPEN, this.clientId);
        })

        this.eventEmitter.on('handshake', (client: string) => {
            log('handshake recieved, id:->' + client, 'warn')
            this.clientId = client;
            this.connState = ConnectionStates.ACTIVE;
            this.stateChangeCallback(ConnectionStates.ACTIVE, this.clientId);
        })


        this.clientSocket.on('close', (code, reason) => {
            //  log('Connection closed , code: ' + code + ", reason: " + reason.toString(), 'info');
            this.connState = ConnectionStates.CLOSED;
            this.stateChangeCallback(ConnectionStates.CLOSED, this.clientId);
        })

        this.clientSocket.on('upgrade', (request) => {
            //  log('Protocol upgraded to sockets', 'info');
            //  this.stateChangeCallback('upgrade', this);
        })

        this.clientSocket.on('message', (data, isBinary) => {
            //  log('Message Recieved, data: ' + data.toString() + ", isBinary: " + isBinary, 'info');
            this.messageHandler.onMessage(data)
        })

        this.clientSocket.on('error', (err) => {
            let e = null;
            try {
                //@ts-ignore
                e = JSON.parse(err.rawPacket?.toString());
                log('Connection Error, error: ' + e, 'error');

            } catch (error) {
                e = new Error('An unknown error occured. Please try again after some time');
            } finally {
                this.connState = ConnectionStates.CLOSED;
                this.stateChangeCallback(ConnectionStates.CLOSED, this.clientId, e);
            }


        })
        log('all listeners attached');
    }


}