import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import {
  RealtimeEventType,
} from './realtime.events.js';

export interface RealtimeEvent {
  id: string;
  type: RealtimeEventType;
  organizationId: string;
  createdAt: string;
  data: Record<string, unknown>;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class RealtimeGateway {
  @WebSocketServer()
  server!: Server;

  @SubscribeMessage('joinOrganization')
  joinOrganization(
    @MessageBody()
    organizationId: string,
    @ConnectedSocket()
    socket: Socket,
  ) {
    if (
      !organizationId ||
      typeof organizationId !== 'string'
    ) {
      return {
        success: false,
        message:
          'organizationId is required',
      };
    }

    const room =
      `organization:${organizationId}`;

    socket.join(room);

    return {
      success: true,
      organizationId,
      room,
    };
  }

  @SubscribeMessage('leaveOrganization')
  leaveOrganization(
    @MessageBody()
    organizationId: string,
    @ConnectedSocket()
    socket: Socket,
  ) {
    if (
      !organizationId ||
      typeof organizationId !== 'string'
    ) {
      return {
        success: false,
        message:
          'organizationId is required',
      };
    }

    const room =
      `organization:${organizationId}`;

    socket.leave(room);

    return {
      success: true,
      organizationId,
      room,
    };
  }

  @SubscribeMessage('ping')
  ping() {
    return {
      success: true,
      timestamp:
        new Date().toISOString(),
    };
  }

  publish(
    event: RealtimeEvent,
  ) {
    this.server
      .to(
        `organization:${event.organizationId}`,
      )
      .emit(
        event.type,
        event,
      );

    this.server.emit(
      'voltis.event',
      event,
    );
  }
}
