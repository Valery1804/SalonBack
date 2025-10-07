import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { User } from '../user/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserResponseDto } from '../user/dto/user-response.dto';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userService.findByEmail(email);
    
    if (!user || !user.isActive) {
      return null;
    }

    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    const accessToken = this.jwtService.sign(payload);
    const expiresIn = 3600; // 1 hora

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn,
      user: new UserResponseDto(user),
    };
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    if (registerDto.password !== registerDto.confirmPassword) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    const user = await this.userService.create({
      email: registerDto.email,
      password: registerDto.password,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      phone: registerDto.phone,
    });

    // Auto-login después del registro
    return this.login({
      email: registerDto.email,
      password: registerDto.password,
    });
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.userService.findByEmail(forgotPasswordDto.email);
    
    if (!user) {
      // Por seguridad, no revelamos si el email existe o no
      return {
        message: 'Si el email existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.',
      };
    }

    // Generar token de recuperación
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    await this.userService.setPasswordResetToken(user.email, resetToken, resetExpires);

    // Aquí deberías enviar el email con el enlace de recuperación
    // Por ahora, solo logueamos el token (en producción, enviar por email)
    console.log(`Token de recuperación para ${user.email}: ${resetToken}`);
    console.log(`Enlace: http://localhost:3000/auth/reset-password?token=${resetToken}`);

    return {
      message: 'Si el email existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    if (resetPasswordDto.password !== resetPasswordDto.confirmPassword) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    const user = await this.userService.findByPasswordResetToken(resetPasswordDto.token);
    
    if (!user) {
      throw new BadRequestException('Token inválido o expirado');
    }

    await this.userService.updatePassword(user.id, resetPasswordDto.password);
    await this.userService.clearPasswordResetToken(user.id);

    return {
      message: 'Contraseña restablecida exitosamente',
    };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.userService.findByEmailVerificationToken(token);
    
    if (!user) {
      throw new BadRequestException('Token de verificación inválido');
    }

    await this.userService.verifyEmail(user.id);

    return {
      message: 'Email verificado exitosamente',
    };
  }

  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    const user = await this.userService.findByEmail(email);
    
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (user.emailVerified) {
      throw new BadRequestException('El email ya está verificado');
    }

    // Generar nuevo token de verificación
    const { v4: uuidv4 } = await import('uuid');
    const verificationToken = uuidv4();
    await this.userService.update(user.id, {
      emailVerificationToken: verificationToken,
    });

    // Aquí deberías enviar el email con el enlace de verificación
    console.log(`Token de verificación para ${user.email}: ${verificationToken}`);
    console.log(`Enlace: http://localhost:3000/auth/verify-email?token=${verificationToken}`);

    return {
      message: 'Email de verificación enviado',
    };
  }
}
