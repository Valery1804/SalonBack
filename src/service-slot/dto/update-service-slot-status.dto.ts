import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ServiceSlotStatus } from '../../common/enums/service-slot-status.enum';

export class UpdateServiceSlotStatusDto {
  @ApiProperty({
    description: 'Nuevo estado del slot',
    enum: ServiceSlotStatus,
    example: ServiceSlotStatus.RESERVED,
  })
  @IsEnum(ServiceSlotStatus, { message: 'El estado proporcionado no es válido' })
  status: ServiceSlotStatus;

  @ApiProperty({
    description: 'ID del cliente que reserva o libera el slot (opcional según el estado)',
    example: '323e4567-e89b-12d3-a456-426614174abc',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'El ID del cliente debe ser un UUID válido' })
  clientId?: string;

  @ApiProperty({
    description: 'Nota o motivo asociado al cambio de estado',
    example: 'Reservado manualmente por el administrador',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'La nota debe ser una cadena de texto' })
  notes?: string;
}
