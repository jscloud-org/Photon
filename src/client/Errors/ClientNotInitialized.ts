export default class ClientNotInitialized extends Error {
    constructor() {
        super();
        this.message = 'Client not initialized yet. Please make sure you are initializing Client before calling getInstance() method';
        this.name = 'Client Not Initialized';
    }
}