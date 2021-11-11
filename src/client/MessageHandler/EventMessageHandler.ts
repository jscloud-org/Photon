import MessagePayload from "../../common/MessagePayload";
import MessageHandler from "./MessageHandler";
import EventEmitter from "events";

export default class EventMessageHandler extends MessageHandler {
    emitter: EventEmitter

    constructor(emitter: EventEmitter) {
        super();
        this.emitter = emitter;
    }

    public onPayloadRecieved(msg: MessagePayload | null): void {
        if (!msg) return;

        switch (msg.type) {
            case 'event': this.emitter.emit(msg.topic, msg.payload); break;
            case 'handshake': this.emitter.emit('handshake', msg.clientId); break;
            case 'raw': this.emitter.emit('raw', msg.payload); break;
            case 'broadcast': this.emitter.emit('broadcast', msg.payload);
        }

    }



}