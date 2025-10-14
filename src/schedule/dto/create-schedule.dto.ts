import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsUUID,
  Matches,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DayOfWeek } from '../../common/enums/day-of-week.enum';

export class CreateScheduleDto {
  @ApiProperty({
    description: 'ID del miembro del personal',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'El ID del personal debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El ID del personal es requerido' })
  staffId: string;

  @ApiProperty({
    description: 'Día de la semana',
    enum: DayOfWeek,
    example: DayOfWeek.LUNES,
  })
  @IsEnum(DayOfWeek, {
    message: 'El día de la semana debe ser un valor válido',
  })
  @IsNotEmpty({ message: 'El día de la semana es requerido' })
  dayOfWeek: DayOfWeek;

  @ApiProperty({
    description: 'Hora de inicio (formato HH:mm)',
    example: '09:00',
  })
  @IsString({ message: 'La hora de inicio debe ser una cadena de texto' })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'La hora de inicio debe tener el formato HH:mm',
  })
  @IsNotEmpty({ message: 'La hora de inicio es requerida' })
  startTime: string;

  @ApiProperty({
    description: 'Hora de fin (formato HH:mm)',
    example: '18:00',
  })
  @IsString({ message: 'La hora de fin debe ser una cadena de texto' })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'La hora de fin debe tener el formato HH:mm',
  })
  @IsNotEmpty({ message: 'La hora de fin es requerida' })
  endTime: string;

  @ApiProperty({
    description: 'Estado activo del horario',
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'El estado debe ser un booleano' })
  isActive?: boolean;
}
