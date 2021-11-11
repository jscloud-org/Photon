import { RawData } from "ws";

export default abstract class Router {
    public abstract onMessage(message: RawData, isBinary?: boolean): void;
}