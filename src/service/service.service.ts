import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Service } from './entities/service.entity';
import { UserRole } from '../common/enums/user-role.enum';

interface CurrentUserLike {
  id: string;
  role: UserRole;
}

@Injectable()
export class ServiceService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
  ) {}

  async create(createServiceDto: CreateServiceDto, provider: CurrentUserLike): Promise<Service> {
    if (provider.role !== UserRole.PRESTADOR_SERVICIO) {
      throw new ForbiddenException('Solo los prestadores de servicio pueden registrar servicios');
    }

    const existingService = await this.serviceRepository.findOne({
      where: { name: createServiceDto.name, providerId: provider.id },
    });

    if (existingService) {
      throw new ConflictException('Ya existe un servicio con ese nombre');
    }

    const service = this.serviceRepository.create({
      ...createServiceDto,
      providerId: provider.id,
    });
    return this.serviceRepository.save(service);
  }

  async findAll(): Promise<Service[]> {
    return this.serviceRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findActive(): Promise<Service[]> {
    return this.serviceRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Service> {
    const service = await this.serviceRepository.findOne({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }

    return service;
  }

  async update(
    id: string,
    updateServiceDto: UpdateServiceDto,
    currentUser: CurrentUserLike,
  ): Promise<Service> {
    const service = await this.ensureServiceAccess(id, currentUser);

    if (updateServiceDto.name && updateServiceDto.name !== service.name) {
      const existingService = await this.serviceRepository.findOne({
        where: {
          name: updateServiceDto.name,
          providerId: service.providerId,
        },
      });

      if (existingService) {
        throw new ConflictException('Ya existe un servicio con ese nombre');
      }
    }

    await this.serviceRepository.update(id, updateServiceDto);
    return this.findOne(id);
  }

  async remove(id: string, currentUser: CurrentUserLike): Promise<void> {
    const service = await this.ensureServiceAccess(id, currentUser);
    await this.serviceRepository.remove(service);
  }

  private async ensureServiceAccess(
    id: string,
    currentUser: CurrentUserLike,
  ): Promise<Service> {
    const service = await this.findOne(id);

    if (
      currentUser.role !== UserRole.ADMIN &&
      service.providerId !== currentUser.id
    ) {
      throw new ForbiddenException('No tienes permiso para modificar este servicio');
    }

    return service;
  }
}
