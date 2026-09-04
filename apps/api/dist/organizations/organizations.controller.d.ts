import type { Request } from 'express';
import { CreateOrganizationDto } from './dto/create-organization.dto.js';
import { OrganizationsService } from './organizations.service.js';
interface AuthenticatedRequest extends Request {
    user: {
        sub: string;
        email: string;
    };
}
export declare class OrganizationsController {
    private readonly organizationsService;
    constructor(organizationsService: OrganizationsService);
    create(request: AuthenticatedRequest, dto: CreateOrganizationDto): Promise<import("./organization.entity.js").Organization>;
    findAll(request: AuthenticatedRequest): Promise<import("./organization.entity.js").Organization[]>;
    findOne(request: AuthenticatedRequest, organizationId: string): Promise<import("./organization.entity.js").Organization>;
}
export {};
