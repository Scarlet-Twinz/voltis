import {
  Injectable,
} from '@nestjs/common';
import {
  randomUUID,
} from 'node:crypto';

import {
  RealtimeEvent,
  RealtimeGateway,
} from './realtime.gateway.js';
import {
  RealtimeEventType,
} from './realtime.events.js';

@Injectable()
export class RealtimeService {
  constructor(
    private readonly gateway:
      RealtimeGateway,
  ) {}

  publish(
    type: RealtimeEventType,
    organizationId: string,
    data: Record<string, unknown>,
  ) {
    const event: RealtimeEvent = {
      id:
        `evt_${randomUUID()}`,

      type,

      organizationId,

      createdAt:
        new Date().toISOString(),

      data,
    };

    this.gateway.publish(
      event,
    );

    return event;
  }
}
