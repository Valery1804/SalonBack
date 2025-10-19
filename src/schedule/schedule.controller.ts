import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ScheduleService } from './schedule.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { CreateScheduleBlockDto } from './dto/create-schedule-block.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../common/enums/user-role.enum';

@ApiTags('Horarios')
@ApiBearerAuth('JWT-auth')
@Controller('schedules')
@UseGuards(RolesGuard)
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  // Horarios regulares
  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Crear horario de trabajo (Solo Admin)' })
  @ApiResponse({ status: 201, description: 'Horario creado exitosamente' })
  create(@Body() createScheduleDto: CreateScheduleDto) {
    return this.scheduleService.create(createScheduleDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.PRESTADOR_SERVICIO)
  @ApiOperation({ summary: 'Obtener todos los horarios' })
  @ApiResponse({
    status: 200,
    description: 'Lista de horarios obtenida exitosamente',
  })
  findAll() {
    return this.scheduleService.findAll();
  }

  @Get('staff/:staffId')
  @Roles(UserRole.ADMIN, UserRole.PRESTADOR_SERVICIO)
  @ApiOperation({ summary: 'Obtener horarios de un miembro del personal' })
  @ApiResponse({
    status: 200,
    description: 'Horarios del staff obtenidos exitosamente',
  })
  findByStaffId(@Param('staffId') staffId: string) {
    return this.scheduleService.findByStaffId(staffId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Obtener un horario por ID (Solo Admin)' })
  @ApiResponse({ status: 200, description: 'Horario obtenido exitosamente' })
  findOne(@Param('id') id: string) {
    return this.scheduleService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar horario (Solo Admin)' })
  @ApiResponse({ status: 200, description: 'Horario actualizado exitosamente' })
  update(
    @Param('id') id: string,
    @Body() updateScheduleDto: UpdateScheduleDto,
  ) {
    return this.scheduleService.update(id, updateScheduleDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar horario (Solo Admin)' })
  @ApiResponse({ status: 200, description: 'Horario eliminado exitosamente' })
  remove(@Param('id') id: string) {
    return this.scheduleService.remove(id);
  }

  // Bloqueos de horarios
  @Post('blocks')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Crear bloqueo de horario (Solo Admin)' })
  @ApiResponse({ status: 201, description: 'Bloqueo creado exitosamente' })
  createBlock(@Body() createScheduleBlockDto: CreateScheduleBlockDto) {
    return this.scheduleService.createBlock(createScheduleBlockDto);
  }

  @Get('blocks/all')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Obtener todos los bloqueos (Solo Admin)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de bloqueos obtenida exitosamente',
  })
  findAllBlocks() {
    return this.scheduleService.findAllBlocks();
  }

  @Get('blocks/date-range')
  @Roles(UserRole.ADMIN, UserRole.PRESTADOR_SERVICIO)
  @ApiOperation({ summary: 'Obtener bloqueos por rango de fechas' })
  @ApiQuery({ name: 'startDate', type: Date, description: 'Fecha de inicio' })
  @ApiQuery({ name: 'endDate', type: Date, description: 'Fecha de fin' })
  @ApiResponse({ status: 200, description: 'Bloqueos obtenidos exitosamente' })
  findBlocksByDateRange(
    @Query('startDate') startDate: Date,
    @Query('endDate') endDate: Date,
  ) {
    return this.scheduleService.findBlocksByDateRange(startDate, endDate);
  }

  @Get('blocks/staff/:staffId')
  @Roles(UserRole.ADMIN, UserRole.PRESTADOR_SERVICIO)
  @ApiOperation({ summary: 'Obtener bloqueos de un miembro del personal' })
  @ApiResponse({
    status: 200,
    description: 'Bloqueos del staff obtenidos exitosamente',
  })
  findBlocksByStaffId(@Param('staffId') staffId: string) {
    return this.scheduleService.findBlocksByStaffId(staffId);
  }

  @Delete('blocks/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar bloqueo (Solo Admin)' })
  @ApiResponse({ status: 200, description: 'Bloqueo eliminado exitosamente' })
  removeBlock(@Param('id') id: string) {
    return this.scheduleService.removeBlock(id);
  }

  @Get('availability/:staffId')
  @ApiOperation({ summary: 'Obtener disponibilidad de un staff en una fecha' })
  @ApiQuery({ name: 'date', type: Date, description: 'Fecha a consultar' })
  @ApiResponse({
    status: 200,
    description: 'Disponibilidad obtenida exitosamente',
  })
  getStaffAvailability(
    @Param('staffId') staffId: string,
    @Query('date') date: Date,
  ) {
    return this.scheduleService.getStaffAvailability(staffId, date);
  }
}
