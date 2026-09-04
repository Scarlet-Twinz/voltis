import {
  Module,
} from '@nestjs/common';

import {
  RealtimeGateway,
} from './realtime.gateway.js';

import {
  RealtimeService,
} from './realtime.service.js';

@Module({
  providers: [
    RealtimeGateway,
    RealtimeService,
  ],
  exports: [
    RealtimeService,
  ],
})
export class EventsModule {}
