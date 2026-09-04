import { Repository } from 'typeorm';
import { Organization } from './organization.entity.js';
import { User } from '../users/user.entity.js';
import { CreateOrganizationDto } from './dto/create-organization.dto.js';
export declare class OrganizationsService {
    private readonly organizationsRepository;
    private readonly usersRepository;
    constructor(organizationsRepository: Repository<Organization>, usersRepository: Repository<User>);
    create(userId: string, dto: CreateOrganizationDto): Promise<Organization>;
    findAllForUser(userId: string): Promise<Organization[]>;
    findOneForUser(userId: string, organizationId: string): Promise<Organization>;
}
