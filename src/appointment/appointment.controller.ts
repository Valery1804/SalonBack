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
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../common/enums/user-role.enum';

@ApiTags('Citas')
@ApiBearerAuth('JWT-auth')
@Controller('appointments')
@UseGuards(RolesGuard)
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva cita' })
  @ApiResponse({ status: 201, description: 'Cita creada exitosamente' })
  @ApiResponse({
    status: 400,
    description: 'Datos invÃ¡lidos o horario no disponible',
  })
  create(@Body() createAppointmentDto: CreateAppointmentDto, @Request() req) {
    return this.appointmentService.create(createAppointmentDto, req.user.sub);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.PRESTADOR_SERVICIO)
  @ApiOperation({ summary: 'Obtener todas las citas (Solo personal y admin)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de citas obtenida exitosamente',
  })
  findAll() {
    return this.appointmentService.findAll();
  }

  @Get('my-appointments')
  @ApiOperation({ summary: 'Obtener mis citas (cliente)' })
  @ApiResponse({ status: 200, description: 'Mis citas obtenidas exitosamente' })
  findMyAppointments(@Request() req) {
    return this.appointmentService.findByClient(req.user.sub);
  }

  @Get('by-client/:clientId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Obtener citas de un cliente (Solo Admin)' })
  @ApiResponse({
    status: 200,
    description: 'Citas del cliente obtenidas exitosamente',
  })
  findByClient(@Param('clientId') clientId: string) {
    return this.appointmentService.findByClient(clientId);
  }

  @Get('by-staff/:staffId')
  @Roles(UserRole.ADMIN, UserRole.PRESTADOR_SERVICIO)
  @ApiOperation({ summary: 'Obtener citas de un miembro del personal' })
  @ApiResponse({
    status: 200,
    description: 'Citas del staff obtenidas exitosamente',
  })
  findByStaff(@Param('staffId') staffId: string) {
    return this.appointmentService.findByStaff(staffId);
  }

  @Get('by-date-range')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Obtener citas por rango de fechas (Solo Admin)' })
  @ApiQuery({ name: 'startDate', type: Date, description: 'Fecha de inicio' })
  @ApiQuery({ name: 'endDate', type: Date, description: 'Fecha de fin' })
  @ApiResponse({ status: 200, description: 'Citas obtenidas exitosamente' })
  findByDateRange(
    @Query('startDate') startDate: Date,
    @Query('endDate') endDate: Date,
  ) {
    return this.appointmentService.findByDateRange(startDate, endDate);
  }

  @Get('statistics')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Obtener estadÃ­sticas de citas (Solo Admin)' })
  @ApiQuery({ name: 'startDate', type: Date, description: 'Fecha de inicio' })
  @ApiQuery({ name: 'endDate', type: Date, description: 'Fecha de fin' })
  @ApiResponse({
    status: 200,
    description: 'EstadÃ­sticas obtenidas exitosamente',
  })
  getStatistics(
    @Query('startDate') startDate: Date,
    @Query('endDate') endDate: Date,
  ) {
    return this.appointmentService.getStatistics(startDate, endDate);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una cita por ID' })
  @ApiResponse({ status: 200, description: 'Cita obtenida exitosamente' })
  @ApiResponse({ status: 404, description: 'Cita no encontrada' })
  findOne(@Param('id') id: string) {
    return this.appointmentService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una cita' })
  @ApiResponse({ status: 200, description: 'Cita actualizada exitosamente' })
  @ApiResponse({ status: 404, description: 'Cita no encontrada' })
  update(
    @Param('id') id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
  ) {
    return this.appointmentService.update(id, updateAppointmentDto);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancelar una cita' })
  @ApiResponse({ status: 200, description: 'Cita cancelada exitosamente' })
  @ApiResponse({ status: 400, description: 'No se puede cancelar la cita' })
  cancel(@Param('id') id: string, @Body() cancelDto: CancelAppointmentDto) {
    return this.appointmentService.cancel(id, cancelDto.reason);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.PRESTADOR_SERVICIO)
  @ApiOperation({
    summary: 'Actualizar estado de una cita (Solo personal y admin)',
  })
  @ApiResponse({ status: 200, description: 'Estado actualizado exitosamente' })
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
  ) {
    return this.appointmentService.updateStatus(id, updateStatusDto.status);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar una cita (Solo Admin)' })
  @ApiResponse({ status: 200, description: 'Cita eliminada exitosamente' })
  @ApiResponse({ status: 404, description: 'Cita no encontrada' })
  remove(@Param('id') id: string) {
    return this.appointmentService.remove(id);
  }
}
