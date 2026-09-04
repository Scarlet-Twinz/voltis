import { RealtimeEvent, RealtimeGateway } from './realtime.gateway.js';
import { RealtimeEventType } from './realtime.events.js';
export declare class RealtimeService {
    private readonly gateway;
    constructor(gateway: RealtimeGateway);
    publish(type: RealtimeEventType, organizationId: string, data: Record<string, unknown>): RealtimeEvent;
}
