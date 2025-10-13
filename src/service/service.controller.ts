import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ServiceService } from './service.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../common/enums/user-role.enum';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Servicios')
@ApiBearerAuth('JWT-auth')
@Controller('services')
@UseGuards(RolesGuard)
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Post()
  @Roles(UserRole.PRESTADOR_SERVICIO)
  @ApiOperation({ summary: 'Crear un nuevo servicio (Solo Prestador de Servicio)' })
  @ApiResponse({ status: 201, description: 'Servicio creado exitosamente' })
  @ApiResponse({ status: 409, description: 'Ya existe un servicio con ese nombre' })
  create(@Body() createServiceDto: CreateServiceDto) {
    return this.serviceService.create(createServiceDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Obtener todos los servicios' })
  @ApiResponse({ status: 200, description: 'Lista de servicios obtenida exitosamente' })
  findAll() {
    return this.serviceService.findAll();
  }

  @Get('active')
  @Public()
  @ApiOperation({ summary: 'Obtener servicios activos' })
  @ApiResponse({ status: 200, description: 'Lista de servicios activos obtenida exitosamente' })
  findActive() {
    return this.serviceService.findActive();
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Obtener un servicio por ID' })
  @ApiResponse({ status: 200, description: 'Servicio obtenido exitosamente' })
  @ApiResponse({ status: 404, description: 'Servicio no encontrado' })
  findOne(@Param('id') id: string) {
    return this.serviceService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.PRESTADOR_SERVICIO)
  @ApiOperation({ summary: 'Actualizar un servicio (Solo Prestador de Servicio)' })
  @ApiResponse({ status: 200, description: 'Servicio actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Servicio no encontrado' })
  update(@Param('id') id: string, @Body() updateServiceDto: UpdateServiceDto) {
    return this.serviceService.update(id, updateServiceDto);
  }

  @Delete(':id')
  @Roles(UserRole.PRESTADOR_SERVICIO)
  @ApiOperation({ summary: 'Eliminar un servicio (Solo Prestador de Servicio)' })
  @ApiResponse({ status: 200, description: 'Servicio eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Servicio no encontrado' })
  remove(@Param('id') id: string) {
    return this.serviceService.remove(id);
  }
}
