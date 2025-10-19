import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  Min,
  Max,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({
    description: 'ID del servicio',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'El ID del servicio debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El ID del servicio es requerido' })
  serviceId: string;

  @ApiProperty({
    description: 'ID de la cita (opcional)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'El ID de la cita debe ser un UUID válido' })
  appointmentId?: string;

  @ApiProperty({
    description: 'Calificación (1-5)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsNumber({}, { message: 'La calificación debe ser un número' })
  @Min(1, { message: 'La calificación mínima es 1' })
  @Max(5, { message: 'La calificación máxima es 5' })
  @IsNotEmpty({ message: 'La calificación es requerida' })
  rating: number;

  @ApiProperty({
    description: 'Comentario de la reseña',
    example: 'Excelente servicio, muy profesional',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'El comentario debe ser una cadena de texto' })
  comment?: string;
}
