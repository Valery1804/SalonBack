import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not, In } from 'typeorm';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { Appointment } from './entities/appointment.entity';
import { AppointmentStatus } from '../common/enums/appointment-status.enum';
import { ServiceService } from '../service/service.service';
import { ScheduleService } from '../schedule/schedule.service';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    private readonly serviceService: ServiceService,
    private readonly scheduleService: ScheduleService,
  ) {}

  async create(createAppointmentDto: CreateAppointmentDto, userId?: string): Promise<Appointment> {
    // Si no se proporciona clientId, usar el userId del usuario autenticado
    const clientId = createAppointmentDto.clientId || userId;
    if (!clientId) {
      throw new BadRequestException('El ID del cliente es requerido');
    }

    // Obtener el servicio para calcular la duración
    const service = await this.serviceService.findOne(createAppointmentDto.serviceId);

    // Calcular hora de fin basado en la duración del servicio
    const endTime = this.calculateEndTime(createAppointmentDto.startTime, service.durationMinutes);

    // Validar disponibilidad
    await this.validateAvailability(
      createAppointmentDto.staffId,
      createAppointmentDto.date,
      createAppointmentDto.startTime,
      endTime,
    );

    const appointment = this.appointmentRepository.create({
      ...createAppointmentDto,
      clientId,
      endTime,
      status: AppointmentStatus.PENDIENTE,
    });

    return this.appointmentRepository.save(appointment);
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

  async findByDateRange(startDate: Date, endDate: Date): Promise<Appointment[]> {
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

  async update(id: string, updateAppointmentDto: UpdateAppointmentDto, userId?: string): Promise<Appointment> {
    const appointment = await this.findOne(id);

    // Si se está actualizando fecha, hora o personal, validar disponibilidad
    if (updateAppointmentDto.date || updateAppointmentDto.startTime || updateAppointmentDto.staffId) {
      const staffId = updateAppointmentDto.staffId || appointment.staffId;
      const date = updateAppointmentDto.date || appointment.date;
      const startTime = updateAppointmentDto.startTime || appointment.startTime;

      let endTime = appointment.endTime;

      // Si cambia la hora de inicio, recalcular hora de fin
      if (updateAppointmentDto.startTime) {
        const service = await this.serviceService.findOne(appointment.serviceId);
        endTime = this.calculateEndTime(startTime, service.durationMinutes);
      }

      await this.validateAvailability(staffId, date, startTime, endTime, id);
    }

    await this.appointmentRepository.update(id, updateAppointmentDto);
    return this.findOne(id);
  }

  async cancel(id: string, reason: string, userId?: string): Promise<Appointment> {
    const appointment = await this.findOne(id);

    if (appointment.status === AppointmentStatus.CANCELADA) {
      throw new BadRequestException('La cita ya está cancelada');
    }

    if (appointment.status === AppointmentStatus.COMPLETADA) {
      throw new BadRequestException('No se puede cancelar una cita completada');
    }

    await this.appointmentRepository.update(id, {
      status: AppointmentStatus.CANCELADA,
      cancellationReason: reason,
    });

    return this.findOne(id);
  }

  async updateStatus(id: string, status: AppointmentStatus): Promise<Appointment> {
    const appointment = await this.findOne(id);

    await this.appointmentRepository.update(id, { status });
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const appointment = await this.findOne(id);
    await this.appointmentRepository.remove(appointment);
  }

  // Métodos auxiliares
  private calculateEndTime(startTime: string, durationMinutes: number): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  }

  private async validateAvailability(
    staffId: string,
    date: Date,
    startTime: string,
    endTime: string,
    excludeAppointmentId?: string,
  ): Promise<void> {
    // 1. Validar que la fecha no sea en el pasado
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const appointmentDate = new Date(date);
    appointmentDate.setHours(0, 0, 0, 0);

    if (appointmentDate < today) {
      throw new BadRequestException('No se pueden agendar citas en fechas pasadas');
    }

    // 2. Obtener disponibilidad del staff
    const availability = await this.scheduleService.getStaffAvailability(staffId, date);

    // Verificar que el staff trabaje ese día
    if (availability.schedules.length === 0) {
      throw new BadRequestException('El personal no trabaja en esta fecha');
    }

    // Verificar que la hora esté dentro del horario laboral
    const isWithinSchedule = availability.schedules.some(
      (schedule) => startTime >= schedule.startTime && endTime <= schedule.endTime,
    );

    if (!isWithinSchedule) {
      throw new BadRequestException('La hora seleccionada está fuera del horario laboral');
    }

    // 3. Verificar bloqueos
    const hasBlock = availability.blocks.some(
      (block) =>
        (startTime >= block.startTime && startTime < block.endTime) ||
        (endTime > block.startTime && endTime <= block.endTime) ||
        (startTime <= block.startTime && endTime >= block.endTime),
    );

    if (hasBlock) {
      throw new BadRequestException('El horario está bloqueado');
    }

    // 4. Verificar conflictos con otras citas
    const whereConditions: any = {
      staffId,
      date,
      status: Not(In([AppointmentStatus.CANCELADA, AppointmentStatus.NO_ASISTIO])),
    };

    if (excludeAppointmentId) {
      whereConditions.id = Not(excludeAppointmentId);
    }

    const existingAppointments = await this.appointmentRepository.find({
      where: whereConditions,
    });

    const hasConflict = existingAppointments.some(
      (apt) =>
        (startTime >= apt.startTime && startTime < apt.endTime) ||
        (endTime > apt.startTime && endTime <= apt.endTime) ||
        (startTime <= apt.startTime && endTime >= apt.endTime),
    );

    if (hasConflict) {
      throw new BadRequestException('Ya existe una cita en este horario');
    }
  }

  // Estadísticas
  async getStatistics(startDate: Date, endDate: Date) {
    const appointments = await this.findByDateRange(startDate, endDate);

    return {
      total: appointments.length,
      pendientes: appointments.filter((a) => a.status === AppointmentStatus.PENDIENTE).length,
      confirmadas: appointments.filter((a) => a.status === AppointmentStatus.CONFIRMADA).length,
      completadas: appointments.filter((a) => a.status === AppointmentStatus.COMPLETADA).length,
      canceladas: appointments.filter((a) => a.status === AppointmentStatus.CANCELADA).length,
      noAsistio: appointments.filter((a) => a.status === AppointmentStatus.NO_ASISTIO).length,
    };
  }
}
