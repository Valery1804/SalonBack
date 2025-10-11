import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';

export class UpdateStatusDto {
  @ApiProperty({
    description: 'Nuevo estado de la cita',
    enum: AppointmentStatus,
    example: AppointmentStatus.CONFIRMADA,
  })
  @IsEnum(AppointmentStatus, { message: 'El estado debe ser un valor válido' })
  @IsNotEmpty({ message: 'El estado es requerido' })
  status: AppointmentStatus;
}
