import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { User } from '../user/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserResponseDto } from '../user/dto/user-response.dto';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import * as crypto from 'crypto';
import { UserRole } from '../common/enums/user-role.enum';
import { CreateUserDto } from 'src/user/dto/create-user.dto';

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
      throw new UnauthorizedException('Credenciales invÃ¡lidas');
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

  async register(registerDto: any): Promise<AuthResponseDto> {
    // Validar que las contraseñas coincidan
    if (registerDto.confirmPassword && registerDto.password !== registerDto.confirmPassword) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    if (
      registerDto.role === UserRole.PRESTADOR_SERVICIO &&
      !registerDto.providerType
    ) {
      throw new BadRequestException(
        'El tipo de proveedor es obligatorio para usuarios con rol PROVEEDOR',
      );
    }
    if (registerDto.role === UserRole.CLIENTE && registerDto.providerType) {
      throw new BadRequestException(
        'El tipo de proveedor no debe ser proporcionado para usuarios con rol CLIENTE',
      );
    }

    await this.userService.create({
      email: registerDto.email,
      password: registerDto.password,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      phone: registerDto.phone,
      role: registerDto.role ?? UserRole.CLIENTE,
      providerType: registerDto.providerType,
    });

    return this.login({
      email: registerDto.email,
      password: registerDto.password,
    });
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.userService.findByEmail(forgotPasswordDto.email);

    if (!user) {
      // Por seguridad, no revelamos si el email existe o no
      return {
        message:
          'Si el email existe en nuestro sistema, recibirÃ¡s un enlace para restablecer tu contraseÃ±a.',
      };
    }

    // Generar token de recuperaciÃ³n
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    await this.userService.setPasswordResetToken(
      user.email,
      resetToken,
      resetExpires,
    );

    // AquÃ­ deberÃ­as enviar el email con el enlace de recuperaciÃ³n
    // Por ahora, solo logueamos el token (en producciÃ³n, enviar por email)
    console.log(`Token de recuperaciÃ³n para ${user.email}: ${resetToken}`);
    console.log(
      `Enlace: http://localhost:3000/auth/reset-password?token=${resetToken}`,
    );

    return {
      message:
        'Si el email existe en nuestro sistema, recibirÃ¡s un enlace para restablecer tu contraseÃ±a.',
    };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    if (resetPasswordDto.password !== resetPasswordDto.confirmPassword) {
      throw new BadRequestException('Las contraseÃ±as no coinciden');
    }

    const user = await this.userService.findByPasswordResetToken(
      resetPasswordDto.token,
    );

    if (!user) {
      throw new BadRequestException('Token invÃ¡lido o expirado');
    }

    await this.userService.updatePassword(user.id, resetPasswordDto.password);
    await this.userService.clearPasswordResetToken(user.id);

    return {
      message: 'ContraseÃ±a restablecida exitosamente',
    };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.userService.findByEmailVerificationToken(token);

    if (!user) {
      throw new BadRequestException('Token de verificaciÃ³n invÃ¡lido');
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
      throw new BadRequestException('El email ya estÃ¡ verificado');
    }

    // Generar nuevo token de verificaciÃ³n
    const verificationToken = crypto.randomUUID();
    await this.userService.update(user.id, {
      emailVerificationToken: verificationToken,
    });

    // AquÃ­ deberÃ­as enviar el email con el enlace de verificaciÃ³n
    console.log(
      `Token de verificaciÃ³n para ${user.email}: ${verificationToken}`,
    );
    console.log(
      `Enlace: http://localhost:3000/auth/verify-email?token=${verificationToken}`,
    );

    return {
      message: 'Email de verificaciÃ³n enviado',
    };
  }
}
