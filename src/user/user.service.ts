import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { randomUUID } from 'crypto';
import { UserRole } from '../common/enums/user-role.enum';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    // Verificar si el email ya existe
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    // Crear el usuario
    const user = this.userRepository.create({
      ...createUserDto,
      providerType:
        createUserDto.role === UserRole.PRESTADOR_SERVICIO
          ? createUserDto.providerType
          : null,
      emailVerificationToken: randomUUID(),
    });

    const savedUser = await this.userRepository.save(user);
    return new UserResponseDto(savedUser);
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.userRepository.find({
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'phone',
        'role',
        'providerType',
        'isActive',
        'emailVerified',
        'createdAt',
        'updatedAt',
      ],
    });

    return users.map(user => new UserResponseDto(user));
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'phone',
        'role',
        'providerType',
        'isActive',
        'emailVerified',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return new UserResponseDto(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Si se está actualizando el email, verificar que no exista
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('El email ya está registrado');
      }
    }

    if (updateUserDto.role && updateUserDto.role !== UserRole.PRESTADOR_SERVICIO) {
      updateUserDto.providerType = null;
    }

    await this.userRepository.update(id, updateUserDto);
    const updatedUser = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'email', 'firstName', 'lastName', 'phone', 'role', 'isActive', 'emailVerified', 'createdAt', 'updatedAt'],
    });

    return new UserResponseDto(updatedUser);
  }

  async remove(id: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    await this.userRepository.remove(user);
  }

  async updatePassword(id: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    user.password = newPassword;
    await this.userRepository.save(user);
  }

  async setPasswordResetToken(email: string, token: string, expires: Date): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    user.passwordResetToken = token;
    user.passwordResetExpires = expires;
    await this.userRepository.save(user);
  }

  async findByPasswordResetToken(token: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .where('user.passwordResetToken = :token', { token })
      .andWhere('user.passwordResetExpires > :now', { now: new Date() })
      .getOne();
  }

  async clearPasswordResetToken(id: string): Promise<void> {
    await this.userRepository.update(id, {
      passwordResetToken: null,
      passwordResetExpires: null,
    });
  }

  async verifyEmail(id: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (user.emailVerified) {
      throw new BadRequestException('El email ya está verificado');
    }

    user.emailVerified = true;
    user.emailVerificationToken = null;
    await this.userRepository.save(user);
  }

  async findByEmailVerificationToken(token: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { emailVerificationToken: token },
    });
  }
}
