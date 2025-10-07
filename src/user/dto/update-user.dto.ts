import { PartialType, OmitType } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password'] as const),
) {
  @ApiProperty({
    description: 'Estado activo del usuario',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'El estado activo debe ser un booleano' })
  isActive?: boolean;

  @ApiProperty({
    description: 'Token de verificación de email',
    example: 'abc123def456',
    required: false,
  })
  @IsOptional()
  emailVerificationToken?: string;
}

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Contraseña actual',
    example: 'MiPasswordActual123!',
  })
  @IsOptional()
  currentPassword: string;

  @ApiProperty({
    description: 'Nueva contraseña',
    example: 'MiNuevaPassword123!',
  })
  @IsOptional()
  newPassword: string;
}
