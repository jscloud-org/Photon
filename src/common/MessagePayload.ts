import { v4 as uid } from 'uuid'
import { RawData } from 'ws'

export default interface MessagePayload {
    id: string,
    type: 'event' | 'raw' | 'event-reg' | 'handshake' | 'broadcast',
    payload?: string | object,
    transform?: 'none' | 'binary' | 'UTF-8',
    createdAt: number,
    clientId?: string,
    recipient?: string[] | string
    topic: 'none' | string,
    encryption: 'none' | 'md5',
    key: string | null
}

export function createEventMessage(topic: string, payload: string | object, clientId: string): MessagePayload {
    return {
        id: uid(),
        type: 'event',
        payload: payload,
        transform: 'none',
        createdAt: Date.now(),
        clientId: clientId,
        recipient: '',
        topic: topic,
        encryption: 'none',
        key: null
    }
}

export function createRawMessage(payload: string | object, clientId: string): MessagePayload {
    return {
        id: uid(),
        type: 'raw',
        payload: payload,
        transform: 'none',
        createdAt: Date.now(),
        clientId: clientId,
        recipient: '',
        topic: 'none',
        encryption: 'none',
        key: null
    }
}

export function createEventRegMessage(topic: string, clientId: string): MessagePayload {
    return {
        id: uid(),
        type: 'event-reg',
        transform: 'none',
        createdAt: Date.now(),
        topic: topic,
        clientId: clientId,
        encryption: 'none',
        key: null
    }
}

export function createHandshakeMessage(clientId: string): MessagePayload {
    return {
        id: uid(),
        type: 'handshake',
        transform: 'none',
        createdAt: Date.now(),
        topic: 'none',
        clientId: clientId,
        encryption: 'none',
        key: null
    }
}
export function createBroadcastMessage(payload: string | object, clientId: string): MessagePayload {
    return {
        id: uid(),
        type: 'broadcast',
        transform: 'none',
        createdAt: Date.now(),
        topic: 'none',
        payload: payload,
        clientId: clientId,
        encryption: 'none',
        key: null
    }
}

export function toMessagePayload(data: RawData): MessagePayload {
    return JSON.parse(data.toString());
}