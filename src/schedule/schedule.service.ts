import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { CreateScheduleBlockDto } from './dto/create-schedule-block.dto';
import { Schedule } from './entities/schedule.entity';
import { ScheduleBlock } from './entities/schedule-block.entity';
import { UserRole } from '../common/enums/user-role.enum';
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
    // Verificar que el horario de inicio sea menor que el de fin
    if (createScheduleDto.startTime >= createScheduleDto.endTime) {
      throw new BadRequestException('La hora de inicio debe ser menor que la hora de fin');
    }

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

    if (updateScheduleDto.startTime && updateScheduleDto.endTime) {
      if (updateScheduleDto.startTime >= updateScheduleDto.endTime) {
        throw new BadRequestException('La hora de inicio debe ser menor que la hora de fin');
      }
    }

    await this.scheduleRepository.update(id, updateScheduleDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const schedule = await this.findOne(id);
    await this.scheduleRepository.remove(schedule);
  }

  // Bloqueos de horarios
  async createBlock(createScheduleBlockDto: CreateScheduleBlockDto): Promise<ScheduleBlock> {
    if (createScheduleBlockDto.startTime >= createScheduleBlockDto.endTime) {
      throw new BadRequestException('La hora de inicio debe ser menor que la hora de fin');
    }

    const block = this.scheduleBlockRepository.create(createScheduleBlockDto);
    return this.scheduleBlockRepository.save(block);
  }

  async findAllBlocks(): Promise<ScheduleBlock[]> {
    return this.scheduleBlockRepository.find({
      relations: ['staff'],
      order: { date: 'ASC', startTime: 'ASC' },
    });
  }

  async findBlocksByDateRange(startDate: Date, endDate: Date): Promise<ScheduleBlock[]> {
    return this.scheduleBlockRepository.find({
      where: {
        date: Between(startDate, endDate),
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
  async getStaffAvailability(staffId: string, date: Date) {
    const dayOfWeek = this.getDayOfWeekFromDate(date) as DayOfWeek;

    // Obtener horarios regulares
    const schedules = await this.scheduleRepository.find({
      where: { staffId, dayOfWeek, isActive: true },
    });

    // Obtener bloqueos para esa fecha
    const blocks = await this.scheduleBlockRepository.find({
      where: [
        { staffId, date, isActive: true },
        { staffId: null, date, isActive: true }, // Bloqueos globales
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
}
