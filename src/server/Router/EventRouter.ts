import { RawData } from "ws";
import { log } from "../../common/Logger";
import MessagePayload, { toMessagePayload } from "../../common/MessagePayload";
import ClientRegistry from "../Registry/ClientRegistry";
import Router from "./Router";

export default class EventRouter extends Router {

    public onMessage(data: RawData, isBinary?: boolean): void {
        const mp = toMessagePayload(data);
        switch (mp.type) {
            case 'event': this.handleEventMessage(mp); break;
            case 'event-reg': this.handleEventRegMessage(mp); break;
            case 'raw': this.handleRawMessage(mp); break;
            case 'broadcast': this.handleBroadcastMessage(mp); break;
        }

    }

    private handleRawMessage(mp: MessagePayload) {

    }

    private handleEventMessage(mp: MessagePayload) {
        const list = ClientRegistry.getInstance().getSubscribersList(mp.topic);
        for (let id of list) {
            //@ts-ignore
            const socket = ClientRegistry.getInstance().getClient(id);
            socket?.send(JSON.stringify(mp));
        }

    }

    private handleEventRegMessage(mp: MessagePayload) {
        if (mp.clientId && mp.topic)
            ClientRegistry.getInstance().subscribeTo(mp.clientId, mp.topic);

    }

    private handleBroadcastMessage(mp: MessagePayload) {
        const list = ClientRegistry.getInstance().getAllClients();
        for (let id of list) {
            const socket = ClientRegistry.getInstance().getClient(id);
            socket?.send(JSON.stringify(mp));
        }
    }

}