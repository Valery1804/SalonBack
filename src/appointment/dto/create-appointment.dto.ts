import {
  IsNotEmpty,
  IsString,
  IsUUID,
  Matches,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAppointmentDto {
  @ApiProperty({
    description:
      'ID del cliente (se obtiene automáticamente del usuario logueado)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'El ID del cliente debe ser un UUID válido' })
  clientId?: string;

  @ApiProperty({
    description: 'ID del miembro del personal',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'El ID del personal debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El ID del personal es requerido' })
  staffId: string;

  @ApiProperty({
    description: 'ID del servicio',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'El ID del servicio debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El ID del servicio es requerido' })
  serviceId: string;

  @ApiProperty({
    description: 'Fecha de la cita',
    example: '2024-12-25',
  })
  @IsDateString(
    {},
    { message: 'La fecha debe tener un formato válido (YYYY-MM-DD)' },
  )
  @IsNotEmpty({ message: 'La fecha es requerida' })
  date: string;

  @ApiProperty({
    description: 'Hora de inicio de la cita (formato HH:mm)',
    example: '10:00',
  })
  @IsString({ message: 'La hora de inicio debe ser una cadena de texto' })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'La hora de inicio debe tener el formato HH:mm',
  })
  @IsNotEmpty({ message: 'La hora de inicio es requerida' })
  startTime: string;

  @ApiProperty({
    description: 'Notas adicionales para la cita',
    example: 'Cliente prefiere corte moderno',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Las notas deben ser una cadena de texto' })
  notes?: string;
}
