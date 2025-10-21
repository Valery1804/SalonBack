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
import { ServiceResponseDto } from './dto/service-response.dto';
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

  async create(
    createServiceDto: CreateServiceDto,
    provider: CurrentUserLike,
  ): Promise<ServiceResponseDto> {
    const { providerId: providerIdFromDto, ...rest } = createServiceDto;
    let ownerId: string | null = null;

    if (provider.role === UserRole.PRESTADOR_SERVICIO) {
      ownerId = provider.id;
    } else if (provider.role === UserRole.ADMIN) {
      ownerId = providerIdFromDto ?? null;
    } else {
      throw new ForbiddenException(
        'No tienes permisos para registrar servicios',
      );
    }

    const existingService = await this.serviceRepository.findOne({
      where: { name: rest.name, providerId: ownerId },
    });

    if (existingService) {
      throw new ConflictException('Ya existe un servicio con ese nombre');
    }

    const service = this.serviceRepository.create({
      ...rest,
      providerId: ownerId,
    });
    const created = await this.serviceRepository.save(service);
    return this.findOne(created.id);
  }

  async findAll(): Promise<ServiceResponseDto[]> {
    const services = await this.serviceRepository.find({
      order: { name: 'ASC' },
    });
    return services.map((service) => new ServiceResponseDto(service));
  }

  async findActive(): Promise<ServiceResponseDto[]> {
    const services = await this.serviceRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
    return services.map((service) => new ServiceResponseDto(service));
  }

  async findOne(id: string): Promise<ServiceResponseDto> {
    const service = await this.findServiceEntity(id);
    return new ServiceResponseDto(service);
  }

  private async findServiceEntity(id: string): Promise<Service> {
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
  ): Promise<ServiceResponseDto> {
    const service = await this.ensureServiceAccess(id, currentUser);
    const targetProviderId =
      updateServiceDto.providerId !== undefined
        ? updateServiceDto.providerId
        : service.providerId;

    if (updateServiceDto.name && updateServiceDto.name !== service.name) {
      const existingService = await this.serviceRepository.findOne({
        where: {
          name: updateServiceDto.name,
          providerId: targetProviderId,
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
    const service = await this.findServiceEntity(id);

    if (
      currentUser.role !== UserRole.ADMIN &&
      service.providerId !== currentUser.id
    ) {
      throw new ForbiddenException(
        'No tienes permiso para modificar este servicio',
      );
    }

    return service;
  }
}
