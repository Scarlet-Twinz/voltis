var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
let RealtimeGateway = class RealtimeGateway {
    server;
    joinOrganization(organizationId, socket) {
        if (!organizationId ||
            typeof organizationId !== 'string') {
            return {
                success: false,
                message: 'organizationId is required',
            };
        }
        const room = `organization:${organizationId}`;
        socket.join(room);
        return {
            success: true,
            organizationId,
            room,
        };
    }
    leaveOrganization(organizationId, socket) {
        if (!organizationId ||
            typeof organizationId !== 'string') {
            return {
                success: false,
                message: 'organizationId is required',
            };
        }
        const room = `organization:${organizationId}`;
        socket.leave(room);
        return {
            success: true,
            organizationId,
            room,
        };
    }
    ping() {
        return {
            success: true,
            timestamp: new Date().toISOString(),
        };
    }
    publish(event) {
        this.server
            .to(`organization:${event.organizationId}`)
            .emit(event.type, event);
        this.server.emit('voltis.event', event);
    }
};
__decorate([
    WebSocketServer(),
    __metadata("design:type", Server)
], RealtimeGateway.prototype, "server", void 0);
__decorate([
    SubscribeMessage('joinOrganization'),
    __param(0, MessageBody()),
    __param(1, ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Socket]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "joinOrganization", null);
__decorate([
    SubscribeMessage('leaveOrganization'),
    __param(0, MessageBody()),
    __param(1, ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Socket]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "leaveOrganization", null);
__decorate([
    SubscribeMessage('ping'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "ping", null);
RealtimeGateway = __decorate([
    WebSocketGateway({
        cors: {
            origin: '*',
        },
    })
], RealtimeGateway);
export { RealtimeGateway };
//# sourceMappingURL=realtime.gateway.js.map