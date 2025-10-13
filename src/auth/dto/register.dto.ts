import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, Matches } from 'class-validator';
import { CreateUserDto } from '../../user/dto/create-user.dto';

export class RegisterDto extends CreateUserDto {
  @ApiProperty({
    description: 'Confirmación de la contraseña',
    example: 'MiPassword123!',
  })
  @IsString({ message: 'La confirmacion de contraseña debe ser texto' })
  @IsNotEmpty({ message: 'La confirmacion de contraseña es requerida' })
  @MinLength(8, { message: 'La confirmacion de contraseña debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'La confirmacion debe cumplir con los requisitos de complejidad',
  })
  confirmPassword: string;
}
