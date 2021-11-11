import RegistryNotInitialized from "../Errors/RegistryNotInitialized";
import RegistryHandler from "./RegistryHandler";
import { WebSocket } from 'ws'
import ClientExists from "../Errors/ClientExists";


export default class ClientRegistry {

    private static mInstance: ClientRegistry
    private registryHandler: RegistryHandler

    constructor(handler: RegistryHandler) {
        this.registryHandler = handler;
    }

    public static getInstance(): ClientRegistry {
        if (!this.mInstance)
            throw new RegistryNotInitialized();
        return this.mInstance;
    }

    public static init(handler: RegistryHandler): ClientRegistry {
        this.mInstance = new ClientRegistry(handler);
        return this.mInstance;
    }

    public addClient(clientId: string, socket: WebSocket) {
        if (this.registryHandler.exists(clientId))
            throw new ClientExists();
        return this.registryHandler.add(clientId, socket);
    }

    public getClient(clientId: string) {
        return this.registryHandler.get(clientId);
    }

    public getAllClients(): string[] {
        return this.registryHandler.getAllClients();
    }

    public subscribeTo(clientId: string, topic: string) {
        return this.registryHandler.subscribe(clientId, topic);
    }

    public getClientCount(): number {
        return this.registryHandler.getCount();
    }

    public getSubscribersList(topic: string) {
        return this.registryHandler.getSubscribersOf(topic);
    }

}