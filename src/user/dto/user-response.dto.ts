import { ApiProperty } from '@nestjs/swagger';
import { User } from '../entities/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { ProviderType } from '../../common/enums/provider-type.enum';

export class UserResponseDto {
  @ApiProperty({
    description: 'ID único del usuario',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Email del usuario',
    example: 'usuario@ejemplo.com',
  })
  email: string;

  @ApiProperty({
    description: 'Nombre del usuario',
    example: 'Juan',
  })
  firstName: string;

  @ApiProperty({
    description: 'Apellido del usuario',
    example: 'Pérez',
  })
  lastName: string;

  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'Juan Pérez',
  })
  fullName: string;

  @ApiProperty({
    description: 'Número de teléfono del usuario',
    example: '+1234567890',
    nullable: true,
  })
  phone?: string;

  @ApiProperty({
    description: 'Estado activo del usuario',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Estado de verificación del email',
    example: false,
  })
  emailVerified: boolean;

  @ApiProperty({
    description: 'Rol del usuario en el sistema',
    enum: UserRole,
    example: UserRole.CLIENTE,
  })
  role: UserRole;

  @ApiProperty({
    description: 'Tipo de prestador',
    enum: ProviderType,
    example: ProviderType.BARBERO,
    nullable: true,
    required: false,
  })
  providerType?: ProviderType | null;

  @ApiProperty({
    description: 'Imagen de perfil en formato base64',
    example: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
    nullable: true,
    required: false,
  })
  profileImage?: string | null;

  @ApiProperty({
    description: 'Fecha de creación del usuario',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización del usuario',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  constructor(user: User) {
    this.id = user.id;
    this.email = user.email;
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.fullName = user.fullName;
    this.phone = user.phone;
    this.isActive = user.isActive;
    this.emailVerified = user.emailVerified;
    this.role = user.role;
    this.providerType = user.providerType ?? null;
    this.profileImage = user.profileImage ?? null;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }
}
