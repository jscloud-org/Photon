export default class ClientNotActive extends Error {
    constructor() {
        super();
        this.message = 'Client not active. Please make sure you are clients connection is active before transferring data to server';
        this.name = 'Client Not Active';
    }
}