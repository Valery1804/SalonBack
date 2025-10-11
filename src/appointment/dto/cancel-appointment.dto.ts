import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CancelAppointmentDto {
  @ApiProperty({
    description: 'Razón de la cancelación',
    example: 'Surgió un imprevisto',
  })
  @IsString({ message: 'La razón debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La razón es requerida' })
  reason: string;
}
