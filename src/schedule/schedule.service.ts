import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { CreateScheduleBlockDto } from './dto/create-schedule-block.dto';
import { Schedule } from './entities/schedule.entity';
import { ScheduleBlock } from './entities/schedule-block.entity';
import { DayOfWeek } from '../common/enums/day-of-week.enum';

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
    @InjectRepository(ScheduleBlock)
    private readonly scheduleBlockRepository: Repository<ScheduleBlock>,
  ) {}

  // Schedules regulares
  async create(createScheduleDto: CreateScheduleDto): Promise<Schedule> {
    this.ensureValidTimeRange(createScheduleDto.startTime, createScheduleDto.endTime);

    const schedule = this.scheduleRepository.create(createScheduleDto);
    return this.scheduleRepository.save(schedule);
  }

  async findAll(): Promise<Schedule[]> {
    return this.scheduleRepository.find({
      relations: ['staff'],
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
  }

  async findByStaffId(staffId: string): Promise<Schedule[]> {
    return this.scheduleRepository.find({
      where: { staffId },
      relations: ['staff'],
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Schedule> {
    const schedule = await this.scheduleRepository.findOne({
      where: { id },
      relations: ['staff'],
    });

    if (!schedule) {
      throw new NotFoundException('Horario no encontrado');
    }

    return schedule;
  }

  async update(id: string, updateScheduleDto: UpdateScheduleDto): Promise<Schedule> {
    const schedule = await this.findOne(id);

    const nextStartTime = updateScheduleDto.startTime ?? schedule.startTime;
    const nextEndTime = updateScheduleDto.endTime ?? schedule.endTime;
    this.ensureValidTimeRange(nextStartTime, nextEndTime);

    await this.scheduleRepository.update(id, updateScheduleDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const schedule = await this.findOne(id);
    await this.scheduleRepository.remove(schedule);
  }

  // Bloqueos de horarios
  async createBlock(createScheduleBlockDto: CreateScheduleBlockDto): Promise<ScheduleBlock> {
    this.ensureValidTimeRange(createScheduleBlockDto.startTime, createScheduleBlockDto.endTime);

    const block = this.scheduleBlockRepository.create(createScheduleBlockDto);
    return this.scheduleBlockRepository.save(block);
  }

  async findAllBlocks(): Promise<ScheduleBlock[]> {
    return this.scheduleBlockRepository.find({
      relations: ['staff'],
      order: { date: 'ASC', startTime: 'ASC' },
    });
  }

  async findBlocksByDateRange(startDate: Date | string, endDate: Date | string): Promise<ScheduleBlock[]> {
    const normalizedStart = this.normalizeDateInput(startDate);
    const normalizedEnd = this.normalizeDateInput(endDate);

    if (normalizedStart > normalizedEnd) {
      throw new BadRequestException('La fecha de inicio debe ser menor o igual que la fecha de fin');
    }

    return this.scheduleBlockRepository.find({
      where: {
        date: Between(normalizedStart, normalizedEnd),
        isActive: true,
      },
      relations: ['staff'],
      order: { date: 'ASC', startTime: 'ASC' },
    });
  }

  async findBlocksByStaffId(staffId: string): Promise<ScheduleBlock[]> {
    return this.scheduleBlockRepository.find({
      where: { staffId },
      relations: ['staff'],
      order: { date: 'ASC', startTime: 'ASC' },
    });
  }

  async removeBlock(id: string): Promise<void> {
    const block = await this.scheduleBlockRepository.findOne({
      where: { id },
    });

    if (!block) {
      throw new NotFoundException('Bloqueo no encontrado');
    }

    await this.scheduleBlockRepository.remove(block);
  }

  // Obtener disponibilidad de un staff en una fecha específica
  async getStaffAvailability(staffId: string, date: Date | string) {
    const normalizedDate = this.normalizeDateInput(date);
    const dayOfWeek = this.getDayOfWeekFromDate(normalizedDate) as DayOfWeek;

    // Obtener horarios regulares
    const schedules = await this.scheduleRepository.find({
      where: { staffId, dayOfWeek, isActive: true },
    });

    // Obtener bloqueos para esa fecha
    const blocks = await this.scheduleBlockRepository.find({
      where: [
        { staffId, date: normalizedDate, isActive: true },
        { staffId: null, date: normalizedDate, isActive: true }, // Bloqueos globales
      ],
    });

    return {
      schedules,
      blocks,
    };
  }

  private getDayOfWeekFromDate(date: Date): DayOfWeek {
    const days = [
      DayOfWeek.DOMINGO,
      DayOfWeek.LUNES,
      DayOfWeek.MARTES,
      DayOfWeek.MIERCOLES,
      DayOfWeek.JUEVES,
      DayOfWeek.VIERNES,
      DayOfWeek.SABADO,
    ];
    return days[date.getDay()];
  }

  private normalizeDateInput(date: Date | string): Date {
    const parsed = typeof date === 'string' ? new Date(date) : date;

    if (!(parsed instanceof Date) || Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('La fecha proporcionada no es válida');
    }

    return parsed;
  }

  private ensureValidTimeRange(startTime: string, endTime: string): void {
    const startMinutes = this.parseTimeToMinutes(startTime);
    const endMinutes = this.parseTimeToMinutes(endTime);

    if (startMinutes >= endMinutes) {
      throw new BadRequestException('La hora de inicio debe ser menor que la hora de fin');
    }
  }

  private parseTimeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);

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
}
