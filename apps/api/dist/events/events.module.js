var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module, } from '@nestjs/common';
import { RealtimeGateway, } from './realtime.gateway.js';
import { RealtimeService, } from './realtime.service.js';
let EventsModule = class EventsModule {
};
EventsModule = __decorate([
    Module({
        providers: [
            RealtimeGateway,
            RealtimeService,
        ],
        exports: [
            RealtimeService,
        ],
    })
], EventsModule);
export { EventsModule };
//# sourceMappingURL=events.module.js.map