import {
  IsNotEmpty,
  IsString,
  IsNumber,
  Min,
  IsOptional,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateServiceDto {
  @ApiProperty({
    description: 'Nombre del servicio',
    example: 'Corte de cabello',
  })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  name: string;

  @ApiProperty({
    description: 'Descripción del servicio',
    example: 'Corte de cabello profesional con lavado incluido',
  })
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La descripción es requerida' })
  description: string;

  @ApiProperty({
    description: 'Precio del servicio',
    example: 25.0,
  })
  @IsNumber({}, { message: 'El precio debe ser un número' })
  @Min(0, { message: 'El precio no puede ser negativo' })
  @IsNotEmpty({ message: 'El precio es requerido' })
  price: number;

  @ApiProperty({
    description: 'Duración del servicio en minutos',
    example: 45,
  })
  @IsNumber({}, { message: 'La duración debe ser un número' })
  @Min(1, { message: 'La duración debe ser al menos 1 minuto' })
  @IsNotEmpty({ message: 'La duración es requerida' })
  durationMinutes: number;

  @ApiProperty({
    description: 'Estado activo del servicio',
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'El estado debe ser un booleano' })
  isActive?: boolean;

  @ApiProperty({
    description: 'ID del prestador asignado (solo administradores)',
    example: 'uuid-del-prestador',
    required: false,
  })
  @IsOptional()
  @IsUUID(undefined, { message: 'El identificador del prestador no es válido' })
  providerId?: string;
}
