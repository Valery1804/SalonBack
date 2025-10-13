import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceSlot } from './entities/service-slot.entity';
import { Service } from '../service/entities/service.entity';
import { User } from '../user/entities/user.entity';
import { GenerateServiceSlotsDto } from './dto/generate-service-slots.dto';
import { UpdateServiceSlotStatusDto } from './dto/update-service-slot-status.dto';
import { ServiceSlotStatus } from '../common/enums/service-slot-status.enum';
import { UserRole } from '../common/enums/user-role.enum';

interface AuthenticatedUser {
  id: string;
  role: UserRole;
}

@Injectable()
export class ServiceSlotService {
  constructor(
    @InjectRepository(ServiceSlot)
    private readonly serviceSlotRepository: Repository<ServiceSlot>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async generateSlots(
    generateDto: GenerateServiceSlotsDto,
    currentUser: AuthenticatedUser,
  ): Promise<ServiceSlot[]> {
    const provider = await this.userRepository.findOne({
      where: { id: generateDto.providerId },
    });

    if (!provider) {
      throw new NotFoundException('Prestador no encontrado');
    }

    if (provider.role !== UserRole.PRESTADOR_SERVICIO) {
      throw new BadRequestException('El usuario seleccionado no es un prestador de servicio');
    }

    if (!provider.providerType) {
      throw new BadRequestException('El prestador no tiene un tipo configurado');
    }

    if (
      currentUser.role === UserRole.PRESTADOR_SERVICIO &&
      provider.id !== currentUser.id
    ) {
      throw new ForbiddenException('No puedes generar slots para otro prestador');
    }

    const service = await this.serviceRepository.findOne({
      where: { id: generateDto.serviceId },
    });

    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }

    const slotDuration = generateDto.durationMinutes ?? service.durationMinutes;

    if (!slotDuration || slotDuration <= 0) {
      throw new BadRequestException('La duración del servicio no es válida');
    }

    const date = this.parseDate(generateDto.date);
    const startMinutes = this.parseTimeToMinutes(generateDto.startTime);
    const endMinutes = this.parseTimeToMinutes(generateDto.endTime);

    if (startMinutes >= endMinutes) {
      throw new BadRequestException('La hora de inicio debe ser menor a la hora de fin');
    }

    if (slotDuration > endMinutes - startMinutes) {
      throw new BadRequestException('La duración del slot excede el rango de tiempo proporcionado');
    }

    const existingSlots = await this.serviceSlotRepository.find({
      where: {
        providerId: provider.id,
        date,
      },
      order: { startTime: 'ASC' },
    });

    const newSlots: ServiceSlot[] = [];

    for (
      let currentStart = startMinutes;
      currentStart + slotDuration <= endMinutes;
      currentStart += slotDuration
    ) {
      const currentEnd = currentStart + slotDuration;
      const startTime = this.minutesToTime(currentStart);
      const endTime = this.minutesToTime(currentEnd);

      const overlaps = existingSlots.some((slot) => {
        const slotStart = this.parseTimeToMinutes(slot.startTime);
        const slotEnd = this.parseTimeToMinutes(slot.endTime);
        const overlap = currentStart < slotEnd && currentEnd > slotStart;
        const reusable =
          slot.status === ServiceSlotStatus.CANCELLED ||
          slot.status === ServiceSlotStatus.BLOCKED;
        return overlap && !reusable;
      });

      if (overlaps) {
        continue;
      }

      const slot = this.serviceSlotRepository.create({
        providerId: provider.id,
        serviceId: service.id,
        providerType: provider.providerType,
        date,
        startTime,
        endTime,
        status: ServiceSlotStatus.AVAILABLE,
      });

      newSlots.push(slot);
    }

    if (newSlots.length === 0) {
      throw new BadRequestException(
        'No se generaron nuevos slots; el rango ya está cubierto',
      );
    }

    return this.serviceSlotRepository.save(newSlots);
  }

  async findByProvider(providerId: string, date?: string): Promise<ServiceSlot[]> {
    await this.ensureProviderExists(providerId);

    const where: Record<string, unknown> = { providerId };
    if (date) {
      where.date = this.parseDate(date);
    }

    return this.serviceSlotRepository.find({
      where,
      order: { date: 'ASC', startTime: 'ASC' },
    });
  }

  async findAvailableByService(serviceId: string, date?: string): Promise<ServiceSlot[]> {
    const service = await this.serviceRepository.findOne({ where: { id: serviceId } });
    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }

    const where: Record<string, unknown> = {
      serviceId,
      status: ServiceSlotStatus.AVAILABLE,
    };

    if (date) {
      where.date = this.parseDate(date);
    }

    return this.serviceSlotRepository.find({
      where,
      order: { date: 'ASC', startTime: 'ASC' },
    });
  }

  async updateStatus(
    slotId: string,
    updateDto: UpdateServiceSlotStatusDto,
    currentUser: AuthenticatedUser,
  ): Promise<ServiceSlot> {
    const slot = await this.serviceSlotRepository.findOne({ where: { id: slotId } });

    if (!slot) {
      throw new NotFoundException('Slot no encontrado');
    }

    if (
      currentUser.role === UserRole.PRESTADOR_SERVICIO &&
      slot.providerId !== currentUser.id
    ) {
      throw new ForbiddenException('No puedes modificar slots de otro prestador');
    }

    if (
      updateDto.status === ServiceSlotStatus.RESERVED &&
      slot.status !== ServiceSlotStatus.AVAILABLE
    ) {
      throw new BadRequestException('Solo se pueden reservar slots disponibles');
    }

    if (updateDto.status === ServiceSlotStatus.RESERVED) {
      if (!updateDto.clientId) {
        throw new BadRequestException('Debe indicar el cliente que reserva el slot');
      }

      const client = await this.userRepository.findOne({
        where: { id: updateDto.clientId },
      });

      if (!client) {
        throw new NotFoundException('Cliente no encontrado');
      }

      slot.clientId = client.id;
    }

    if (updateDto.status === ServiceSlotStatus.AVAILABLE) {
      slot.clientId = null;
    }

    if (
      updateDto.status === ServiceSlotStatus.CANCELLED ||
      updateDto.status === ServiceSlotStatus.BLOCKED
    ) {
      slot.clientId = null;
    }

    if (updateDto.status === ServiceSlotStatus.COMPLETED && updateDto.clientId) {
      slot.clientId = updateDto.clientId;
    }

    slot.status = updateDto.status;
    slot.notes = updateDto.notes ?? null;

    return this.serviceSlotRepository.save(slot);
  }

  private async ensureProviderExists(providerId: string): Promise<void> {
    const provider = await this.userRepository.findOne({ where: { id: providerId } });
    if (!provider) {
      throw new NotFoundException('Prestador no encontrado');
    }

    if (provider.role !== UserRole.PRESTADOR_SERVICIO) {
      throw new BadRequestException('El usuario indicado no es un prestador de servicio');
    }

    if (!provider.providerType) {
      throw new BadRequestException('El prestador no tiene un tipo configurado');
    }
  }

  private parseDate(date: string): Date {
    const [year, month, day] = date.split('-').map((part) => Number(part));

    if (
      Number.isNaN(year) ||
      Number.isNaN(month) ||
      Number.isNaN(day) ||
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > 31
    ) {
      throw new BadRequestException('La fecha proporcionada no es válida');
    }

    return new Date(Date.UTC(year, month - 1, day));
  }

  private parseTimeToMinutes(time: string): number {
    const [hoursStr, minutesStr] = time.split(':');
    const hours = Number(hoursStr);
    const minutes = Number(minutesStr);

    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes) ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      throw new BadRequestException('El formato de la hora no es válido');
    }

    return hours * 60 + minutes;
  }

  private minutesToTime(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
}
