import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not, In } from 'typeorm';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { Appointment } from './entities/appointment.entity';
import { AppointmentStatus } from '../common/enums/appointment-status.enum';
import { ServiceService } from '../service/service.service';
import { ScheduleService } from '../schedule/schedule.service';
import { ServiceSlot } from '../service-slot/entities/service-slot.entity';
import { ServiceSlotStatus } from '../common/enums/service-slot-status.enum';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(ServiceSlot)
    private readonly serviceSlotRepository: Repository<ServiceSlot>,
    private readonly serviceService: ServiceService,
    private readonly scheduleService: ScheduleService,
  ) {}

  async create(
    createAppointmentDto: CreateAppointmentDto,
    userId?: string,
  ): Promise<Appointment> {
    const clientId = createAppointmentDto.clientId || userId;
    if (!clientId) {
      throw new BadRequestException('El ID del cliente es requerido');
    }

    const service = await this.serviceService.findOne(
      createAppointmentDto.serviceId,
    );
    const endTime = this.calculateEndTime(
      createAppointmentDto.startTime,
      service.durationMinutes,
    );

    await this.validateAvailability(
      createAppointmentDto.serviceId,
      createAppointmentDto.staffId,
      createAppointmentDto.date,
      createAppointmentDto.startTime,
      endTime,
      clientId,
    );

    await this.reserveSlotForAppointment(
      createAppointmentDto.serviceId,
      createAppointmentDto.date,
      createAppointmentDto.startTime,
      clientId,
    );

    const appointment = this.appointmentRepository.create({
      ...createAppointmentDto,
      clientId,
      endTime,
      status: AppointmentStatus.PENDIENTE,
    });

    try {
      return await this.appointmentRepository.save(appointment);
    } catch (error) {
      await this.releaseSlotForAppointment(
        createAppointmentDto.serviceId,
        createAppointmentDto.date,
        createAppointmentDto.startTime,
        clientId,
      );
      throw error;
    }
  }

  async findAll(): Promise<Appointment[]> {
    return this.appointmentRepository.find({
      relations: ['client', 'staff', 'service'],
      order: { date: 'ASC', startTime: 'ASC' },
    });
  }

  async findByClient(clientId: string): Promise<Appointment[]> {
    return this.appointmentRepository.find({
      where: { clientId },
      relations: ['client', 'staff', 'service'],
      order: { date: 'DESC', startTime: 'DESC' },
    });
  }

  async findByStaff(staffId: string): Promise<Appointment[]> {
    return this.appointmentRepository.find({
      where: { staffId },
      relations: ['client', 'staff', 'service'],
      order: { date: 'ASC', startTime: 'ASC' },
    });
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<Appointment[]> {
    return this.appointmentRepository.find({
      where: {
        date: Between(startDate, endDate),
      },
      relations: ['client', 'staff', 'service'],
      order: { date: 'ASC', startTime: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
      relations: ['client', 'staff', 'service'],
    });

    if (!appointment) {
      throw new NotFoundException('Cita no encontrada');
    }

    return appointment;
  }

  async update(
    id: string,
    updateAppointmentDto: UpdateAppointmentDto,
  ): Promise<Appointment> {
    const appointment = await this.findOne(id);

    const originalServiceId = appointment.serviceId;
    const originalDate = appointment.date;
    const originalStartTime = appointment.startTime;

    const targetServiceId =
      updateAppointmentDto.serviceId || appointment.serviceId;
    const targetDate = updateAppointmentDto.date || appointment.date;
    const targetStartTime =
      updateAppointmentDto.startTime || appointment.startTime;

    if (
      updateAppointmentDto.date ||
      updateAppointmentDto.startTime ||
      updateAppointmentDto.staffId ||
      updateAppointmentDto.serviceId
    ) {
      const staffId = updateAppointmentDto.staffId || appointment.staffId;
      const date = targetDate;
      const startTime = targetStartTime;

      let endTime = appointment.endTime;
      if (updateAppointmentDto.startTime || updateAppointmentDto.serviceId) {
        const service = await this.serviceService.findOne(targetServiceId);
        endTime = this.calculateEndTime(startTime, service.durationMinutes);
      }

      await this.validateAvailability(
        targetServiceId,
        staffId,
        date,
        startTime,
        endTime,
        appointment.clientId,
        id,
      );
    }

    const normalizedOriginalStart = this.normalizeTime(originalStartTime);
    const normalizedTargetStart = this.normalizeTime(targetStartTime);
    const originalDateValue = this.toDateOnly(originalDate).getTime();
    const targetDateValue = this.toDateOnly(targetDate).getTime();
    const slotChanged =
      originalServiceId !== targetServiceId ||
      normalizedOriginalStart !== normalizedTargetStart ||
      originalDateValue !== targetDateValue;

    let newSlotReserved = false;
    if (slotChanged) {
      await this.reserveSlotForAppointment(
        targetServiceId,
        targetDate,
        normalizedTargetStart,
        appointment.clientId,
      );
      newSlotReserved = true;
    }

    try {
      await this.appointmentRepository.update(id, updateAppointmentDto);
      if (slotChanged) {
        await this.releaseSlotForAppointment(
          originalServiceId,
          originalDate,
          normalizedOriginalStart,
          appointment.clientId,
        );
      }
      return this.findOne(id);
    } catch (error) {
      if (newSlotReserved) {
        await this.releaseSlotForAppointment(
          targetServiceId,
          targetDate,
          normalizedTargetStart,
          appointment.clientId,
        );
      }
      throw error;
    }
  }

  async cancel(id: string, reason: string): Promise<Appointment> {
    const appointment = await this.findOne(id);

    if (appointment.status === AppointmentStatus.CANCELADA) {
      throw new BadRequestException('La cita ya esta cancelada');
    }

    if (appointment.status === AppointmentStatus.COMPLETADA) {
      throw new BadRequestException('No se puede cancelar una cita completada');
    }

    await this.appointmentRepository.update(id, {
      status: AppointmentStatus.CANCELADA,
      cancellationReason: reason,
    });

    await this.releaseSlotForAppointment(
      appointment.serviceId,
      appointment.date,
      appointment.startTime,
      appointment.clientId,
    );

    return this.findOne(id);
  }

  async updateStatus(
    id: string,
    status: AppointmentStatus,
  ): Promise<Appointment> {
    await this.findOne(id);
    await this.appointmentRepository.update(id, { status });
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const appointment = await this.findOne(id);
    await this.appointmentRepository.remove(appointment);
    await this.releaseSlotForAppointment(
      appointment.serviceId,
      appointment.date,
      appointment.startTime,
      appointment.clientId,
    );
  }

  private calculateEndTime(startTime: string, durationMinutes: number): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  }

  private async validateAvailability(
    serviceId: string,
    staffId: string,
    date: Date,
    startTime: string,
    endTime: string,
    clientId: string,
    excludeAppointmentId?: string,
  ): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const appointmentDate = new Date(date);
    appointmentDate.setHours(0, 0, 0, 0);

    if (appointmentDate < today) {
      throw new BadRequestException(
        'No se pueden agendar citas en fechas pasadas',
      );
    }

    const normalizedStart = this.normalizeTime(startTime);
    const normalizedEnd = this.normalizeTime(endTime);
    const dateOnly = this.toDateOnly(date);

    const slot = await this.serviceSlotRepository.findOne({
      where: {
        serviceId,
        date: dateOnly,
        startTime: normalizedStart,
      },
    });

    if (!slot) {
      throw new BadRequestException(
        'No existe un slot configurado para este horario',
      );
    }

    const slotBelongsToClient = slot.clientId === clientId;
    const slotUsable =
      slot.status === ServiceSlotStatus.AVAILABLE ||
      (slot.status === ServiceSlotStatus.RESERVED && slotBelongsToClient);

    if (!slotUsable) {
      throw new BadRequestException('El horario no esta disponible');
    }

    const whereConditions: Record<string, unknown> = {
      staffId,
      date: dateOnly,
      status: Not(
        In([AppointmentStatus.CANCELADA, AppointmentStatus.NO_ASISTIO]),
      ),
    };

    if (excludeAppointmentId) {
      whereConditions.id = Not(excludeAppointmentId);
    }

    const existingAppointments = await this.appointmentRepository.find({
      where: whereConditions,
    });

    const hasConflict = existingAppointments.some((apt) => {
      const aptStart = this.normalizeTime(apt.startTime);
      const aptEnd = this.normalizeTime(apt.endTime);
      return (
        (normalizedStart >= aptStart && normalizedStart < aptEnd) ||
        (normalizedEnd > aptStart && normalizedEnd <= aptEnd) ||
        (normalizedStart <= aptStart && normalizedEnd >= aptEnd)
      );
    });

    if (hasConflict) {
      throw new BadRequestException('Ya existe una cita en este horario');
    }
  }

  private toDateOnly(input: Date | string): Date {
    const date = input instanceof Date ? new Date(input) : new Date(input);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private normalizeTime(time: string): string {
    if (!time) {
      return time;
    }
    return time.length === 5 ? `${time}:00` : time;
  }

  private async reserveSlotForAppointment(
    serviceId: string,
    date: Date | string,
    startTime: string,
    clientId: string,
  ): Promise<void> {
    const normalizedStartTime = this.normalizeTime(startTime);
    const slot = await this.serviceSlotRepository.findOne({
      where: {
        serviceId,
        date: this.toDateOnly(date),
        startTime: normalizedStartTime,
        status: ServiceSlotStatus.AVAILABLE,
      },
    });

    if (!slot) {
      throw new BadRequestException(
        'No existe un slot disponible para este horario',
      );
    }

    slot.status = ServiceSlotStatus.RESERVED;
    slot.clientId = clientId;
    await this.serviceSlotRepository.save(slot);
  }

  private async releaseSlotForAppointment(
    serviceId: string,
    date: Date | string,
    startTime: string,
    clientId: string,
  ): Promise<void> {
    const normalizedStartTime = this.normalizeTime(startTime);
    const slot = await this.serviceSlotRepository.findOne({
      where: {
        serviceId,
        date: this.toDateOnly(date),
        startTime: normalizedStartTime,
      },
    });

    if (!slot) {
      return;
    }

    if (slot.clientId !== clientId) {
      return;
    }

    slot.status = ServiceSlotStatus.AVAILABLE;
    slot.clientId = null;
    await this.serviceSlotRepository.save(slot);
  }

  async getStatistics(startDate: Date, endDate: Date) {
    const appointments = await this.findByDateRange(startDate, endDate);

    return {
      total: appointments.length,
      pendientes: appointments.filter(
        (a) => a.status === AppointmentStatus.PENDIENTE,
      ).length,
      confirmadas: appointments.filter(
        (a) => a.status === AppointmentStatus.CONFIRMADA,
      ).length,
      completadas: appointments.filter(
        (a) => a.status === AppointmentStatus.COMPLETADA,
      ).length,
      canceladas: appointments.filter(
        (a) => a.status === AppointmentStatus.CANCELADA,
      ).length,
      noAsistio: appointments.filter(
        (a) => a.status === AppointmentStatus.NO_ASISTIO,
      ).length,
    };
  }
}
