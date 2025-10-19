import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Matches,
  IsInt,
  Min,
} from 'class-validator';

export class GenerateServiceSlotsDto {
  @ApiProperty({
    description: 'ID del prestador que ofrece el servicio',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'El ID del prestador debe ser un UUID vÃ¡lido' })
  @IsNotEmpty({ message: 'El ID del prestador es requerido' })
  providerId: string;

  @ApiProperty({
    description: 'ID del servicio a ofertar',
    example: '223e4567-e89b-12d3-a456-426614174999',
  })
  @IsUUID('4', { message: 'El ID del servicio debe ser un UUID vÃ¡lido' })
  @IsNotEmpty({ message: 'El ID del servicio es requerido' })
  serviceId: string;

  @ApiProperty({
    description: 'Fecha para la que se generarÃ¡n los bloques',
    example: '2025-10-13',
  })
  @IsDateString({}, { message: 'La fecha debe tener un formato ISO vÃ¡lido' })
  date: string;

  @ApiProperty({
    description: 'Hora de inicio (HH:mm)',
    example: '12:00',
  })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'La hora de inicio debe tener el formato HH:mm',
  })
  startTime: string;

  @ApiProperty({
    description: 'Hora de fin (HH:mm)',
    example: '18:00',
  })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'La hora de fin debe tener el formato HH:mm',
  })
  endTime: string;

  @ApiProperty({
    description:
      'DuraciÃ³n personalizada de cada slot en minutos (opcional, se usa la duraciÃ³n del servicio por defecto)',
    example: 15,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'La duraciÃ³n debe ser un nÃºmero entero' })
  @Min(5, { message: 'La duraciÃ³n mÃ­nima es de 5 minutos' })
  durationMinutes?: number;
}
