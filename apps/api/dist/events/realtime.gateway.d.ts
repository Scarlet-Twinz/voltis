import { Server, Socket } from 'socket.io';
import { RealtimeEventType } from './realtime.events.js';
export interface RealtimeEvent {
    id: string;
    type: RealtimeEventType;
    organizationId: string;
    createdAt: string;
    data: Record<string, unknown>;
}
export declare class RealtimeGateway {
    server: Server;
    joinOrganization(organizationId: string, socket: Socket): {
        success: boolean;
        message: string;
        organizationId?: undefined;
        room?: undefined;
    } | {
        success: boolean;
        organizationId: string;
        room: string;
        message?: undefined;
    };
    leaveOrganization(organizationId: string, socket: Socket): {
        success: boolean;
        message: string;
        organizationId?: undefined;
        room?: undefined;
    } | {
        success: boolean;
        organizationId: string;
        room: string;
        message?: undefined;
    };
    ping(): {
        success: boolean;
        timestamp: string;
    };
    publish(event: RealtimeEvent): void;
}
