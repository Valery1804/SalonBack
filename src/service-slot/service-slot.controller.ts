import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { ServiceSlotService } from './service-slot.service';
import { GenerateServiceSlotsDto } from './dto/generate-service-slots.dto';
import { UpdateServiceSlotStatusDto } from './dto/update-service-slot-status.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Service Slots')
@ApiBearerAuth('JWT-auth')
@Controller('service-slots')
@UseGuards(RolesGuard)
export class ServiceSlotController {
  constructor(private readonly serviceSlotService: ServiceSlotService) {}

  @Post('generate')
  @Roles(UserRole.ADMIN, UserRole.PRESTADOR_SERVICIO)
  @ApiOperation({ summary: 'Generar slots de servicio para un prestador' })
  @ApiResponse({
    status: 201,
    description: 'Slots generados exitosamente',
  })
  generateSlots(
    @Body() generateDto: GenerateServiceSlotsDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.serviceSlotService.generateSlots(generateDto, currentUser);
  }

  @Get('mine')
  @Roles(UserRole.PRESTADOR_SERVICIO)
  @ApiOperation({ summary: 'Listar mis slots como prestador' })
  @ApiQuery({ name: 'date', required: false, description: 'Filtrar por fecha (YYYY-MM-DD)' })
  findMySlots(
    @CurrentUser() currentUser: any,
    @Query('date') date?: string,
  ) {
    return this.serviceSlotService.findByProvider(currentUser.id, date);
  }

  @Get('provider/:providerId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar slots de un prestador (Solo Admin)' })
  @ApiQuery({ name: 'date', required: false, description: 'Filtrar por fecha (YYYY-MM-DD)' })
  findByProvider(
    @Param('providerId') providerId: string,
    @Query('date') date?: string,
  ) {
    return this.serviceSlotService.findByProvider(providerId, date);
  }

  @Get('available')
  @Public()
  @ApiOperation({ summary: 'Obtener slots disponibles por servicio' })
  @ApiQuery({
    name: 'serviceId',
    required: true,
    description: 'ID del servicio',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Fecha (YYYY-MM-DD)',
  })
  findAvailable(
    @Query('serviceId') serviceId: string,
    @Query('date') date?: string,
  ) {
    return this.serviceSlotService.findAvailableByService(serviceId, date);
  }

  @Patch(':slotId/status')
  @Roles(UserRole.ADMIN, UserRole.PRESTADOR_SERVICIO)
  @ApiOperation({ summary: 'Actualizar el estado de un slot' })
  @ApiResponse({ status: 200, description: 'Slot actualizado exitosamente' })
  updateStatus(
    @Param('slotId') slotId: string,
    @Body() updateDto: UpdateServiceSlotStatusDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.serviceSlotService.updateStatus(slotId, updateDto, currentUser);
  }
}
