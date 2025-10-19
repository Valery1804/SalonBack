import {
  IsNotEmpty,
  IsString,
  IsUUID,
  Matches,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateScheduleBlockDto {
  @ApiProperty({
    description:
      'ID del miembro del personal (opcional, si es null se bloquea para todos)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'El ID del personal debe ser un UUID válido' })
  staffId?: string;

  @ApiProperty({
    description: 'Fecha del bloqueo',
    example: '2024-12-25',
  })
  @IsDateString(
    {},
    { message: 'La fecha debe tener un formato válido (YYYY-MM-DD)' },
  )
  @IsNotEmpty({ message: 'La fecha es requerida' })
  date: Date;

  @ApiProperty({
    description: 'Hora de inicio del bloqueo (formato HH:mm)',
    example: '09:00',
  })
  @IsString({ message: 'La hora de inicio debe ser una cadena de texto' })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'La hora de inicio debe tener el formato HH:mm',
  })
  @IsNotEmpty({ message: 'La hora de inicio es requerida' })
  startTime: string;

  @ApiProperty({
    description: 'Hora de fin del bloqueo (formato HH:mm)',
    example: '18:00',
  })
  @IsString({ message: 'La hora de fin debe ser una cadena de texto' })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'La hora de fin debe tener el formato HH:mm',
  })
  @IsNotEmpty({ message: 'La hora de fin es requerida' })
  endTime: string;

  @ApiProperty({
    description: 'Razón del bloqueo',
    example: 'Día festivo',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'La razón debe ser una cadena de texto' })
  reason?: string;
}
