import { readFileSync } from 'fs';
import { createServer as createHttpServer, IncomingMessage, Server } from 'http';
import { createServer as createHttpsServer } from 'https';
import { WebSocket, WebSocketServer } from 'ws';
import SSLConfig from './SSLConfig';
import Logger from '../common/Logger';
import { createHandshakeMessage } from '../common/MessagePayload';
import RequestAuthenticator from './Authenticator/RequestAuthenticator';
import TokenAuthenticator from './Authenticator/TokenAuthenticator';
import HubNotInitialized from './Errors/HubNotInitialized';
import ClientRegistry from './Registry/ClientRegistry';
import HashMapRegistryHandler from './Registry/HashMapRegistryHandler';
import RegistryHandler from './Registry/RegistryHandler';
import EventRouter from './Router/EventRouter';
import Router from './Router/Router';


export class Hub {

    private static mInstance: Hub
    private socketServer: WebSocketServer
    private httpServer: Server
    private clientRegistry: ClientRegistry
    private authenticator: RequestAuthenticator;
    private router: Router
    private log:Function

    PORT: number

    private constructor(PORT: number, sslConfig: SSLConfig | undefined,
        handler: RegistryHandler,
        authenticator: RequestAuthenticator,
        router: Router = new EventRouter()) {
        this.PORT = PORT;
        this.log=new Logger("SERVER").log;
        this.log('Initializing new Hub Server');
        //build Http/s Server
        this.httpServer = (sslConfig && sslConfig.cert && sslConfig.key) ? createHttpsServer({
            cert: readFileSync(sslConfig.cert),
            key: readFileSync(sslConfig.key)
        }) : createHttpServer();

        //Connect Http/s server to socket
        this.socketServer = new WebSocketServer({
            noServer: true
        });

        this.router = router;
        this.authenticator = authenticator;
        this.clientRegistry = ClientRegistry.init(handler);
        this.attachDefaultListeners();
        this.httpServer.listen(PORT);

    }


    private attachDefaultListeners() {
        if (!this.socketServer)
            return;

        this.log('attaching default listeners...');

        this.httpServer.on('upgrade', (request, socket, head) => {
            this.authenticator.authenticate(request, (error, client) => {
                if (error || !client) {
                    socket.write(JSON.stringify(error));
                    socket.destroy();
                    return;
                }
                this.log('Connection authorized for client ' + client,'success');
                //@ts-ignore
                this.socketServer.handleUpgrade(request, socket, head, (webSocket) => {
                    this.socketServer.emit('connection', webSocket, request, client);
                })
            })
        })

        this.socketServer.on('connection', (socket: WebSocket, request: IncomingMessage, client: string) => {

            ClientRegistry.getInstance().addClient(client, socket);

            this.log('New Connection from ' + client, 'info');

            socket.on('message', (data, isBinary) => {
                this.router.onMessage(data, isBinary);
            })

            socket.on('close', (code: number, reason: Buffer) => {
                this.log('Client Disconnected', 'warn');
                this.log('code:' + code + ' reason: ' + reason.toString(),'warn');
            })

            socket.on('error', (err) => {
                this.log(err, 'error');
            })

            socket.on('ping', (data) => {
                this.log('Ping Recieved, data: ' + data.toString(),'success');
            })

            const handshakeMessage = createHandshakeMessage(client);

            socket.send(JSON.stringify(handshakeMessage));

        });


        this.socketServer.on('close', () => {
            this.log('Server Closed', 'warn')
        })

        this.socketServer.on('error', (error) => {
            this.log('Server Error' + error, 'error')
        })

        this.socketServer.on('listening', () => {
            this.log('WebSocket Server is Up and listening on PORT: ' + this.PORT, 'success')
        })

        this.log('all listeners attached', 'success')
    }

    public static getInstance(): Hub {
        if (!this.mInstance)
            throw new HubNotInitialized();
        return this.mInstance;
    }

    public static init(PORT: number,
        sslConfig?: SSLConfig,
        handler: RegistryHandler = new HashMapRegistryHandler(),
        authenticator: RequestAuthenticator = new TokenAuthenticator()): Hub {
        this.mInstance = new Hub(PORT, sslConfig, handler, authenticator);
        return this.mInstance;
    }

    public getClientCount(): number {
        return this.clientRegistry.getClientCount();
    }

}