import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesiÃ³n' })
  @ApiResponse({
    status: 200,
    description: 'Inicio de sesiÃ³n exitoso',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Credenciales invÃ¡lidas' })
  @ApiResponse({ status: 400, description: 'Datos de entrada invÃ¡lidos' })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar nuevo usuario' })
  @ApiResponse({
    status: 201,
    description: 'Usuario registrado exitosamente',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 409, description: 'El email ya estÃ¡ registrado' })
  @ApiResponse({ status: 400, description: 'Datos de entrada invÃ¡lidos' })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicitar recuperaciÃ³n de contraseÃ±a' })
  @ApiResponse({
    status: 200,
    description: 'Solicitud de recuperaciÃ³n enviada exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example:
            'Si el email existe en nuestro sistema, recibirÃ¡s un enlace para restablecer tu contraseÃ±a.',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada invÃ¡lidos' })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restablecer contraseÃ±a con token' })
  @ApiResponse({
    status: 200,
    description: 'ContraseÃ±a restablecida exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'ContraseÃ±a restablecida exitosamente',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Token invÃ¡lido o contraseÃ±as no coinciden',
  })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Public()
  @Get('verify-email')
  @ApiOperation({ summary: 'Verificar email con token' })
  @ApiQuery({
    name: 'token',
    description: 'Token de verificaciÃ³n de email',
    example: 'abc123def456',
  })
  @ApiResponse({
    status: 200,
    description: 'Email verificado exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Email verificado exitosamente',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Token de verificaciÃ³n invÃ¡lido' })
  async verifyEmail(
    @Query('token') token: string,
  ): Promise<{ message: string }> {
    return this.authService.verifyEmail(token);
  }

  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reenviar email de verificaciÃ³n' })
  @ApiResponse({
    status: 200,
    description: 'Email de verificaciÃ³n enviado',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Email de verificaciÃ³n enviado',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Email ya verificado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async resendVerificationEmail(
    @Body() body: { email: string },
  ): Promise<{ message: string }> {
    return this.authService.resendVerificationEmail(body.email);
  }

  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Perfil del usuario obtenido exitosamente',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getProfile(@CurrentUser() user: any): Promise<any> {
    return user;
  }
}
