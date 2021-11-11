import { RawData } from "ws";
import MessagePayload from "../../common/MessagePayload";

export default abstract class MessageHandler {
    public onMessage(msg: RawData): void {
        this.onPayloadRecieved(this.toMessagePayload(msg));
    }

    private toMessagePayload(rawData: RawData): MessagePayload | null {

        return JSON.parse(rawData.toString());
    }

    public abstract onPayloadRecieved(msg: MessagePayload | null): void;

}