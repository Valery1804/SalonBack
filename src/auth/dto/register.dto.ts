import { ApiProperty } from '@nestjs/swagger';
import { CreateUserDto } from '../../user/dto/create-user.dto';

export class RegisterDto extends CreateUserDto {
  @ApiProperty({
    description: 'Confirmación de contraseña',
    example: 'MiPassword123!',
  })
  confirmPassword: string;
}
