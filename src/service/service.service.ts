import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Service } from './entities/service.entity';

@Injectable()
export class ServiceService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
  ) {}

  async create(createServiceDto: CreateServiceDto): Promise<Service> {
    const existingService = await this.serviceRepository.findOne({
      where: { name: createServiceDto.name },
    });

    if (existingService) {
      throw new ConflictException('Ya existe un servicio con ese nombre');
    }

    const service = this.serviceRepository.create(createServiceDto);
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

  async update(id: string, updateServiceDto: UpdateServiceDto): Promise<Service> {
    const service = await this.findOne(id);

    if (updateServiceDto.name && updateServiceDto.name !== service.name) {
      const existingService = await this.serviceRepository.findOne({
        where: { name: updateServiceDto.name },
      });

      if (existingService) {
        throw new ConflictException('Ya existe un servicio con ese nombre');
      }
    }

    await this.serviceRepository.update(id, updateServiceDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const service = await this.findOne(id);
    await this.serviceRepository.remove(service);
  }
}
