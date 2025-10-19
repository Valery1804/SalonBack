import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../common/enums/user-role.enum';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Reseñas')
@ApiBearerAuth('JWT-auth')
@Controller('reviews')
@UseGuards(RolesGuard)
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva reseña' })
  @ApiResponse({ status: 201, description: 'Reseña creada exitosamente' })
  create(@Body() createReviewDto: CreateReviewDto, @Request() req) {
    const userId = req?.user?.id ?? req?.user?.sub;

    if (!userId) {
      throw new UnauthorizedException('Debes iniciar sesion para dejar una resena');
    }

    return this.reviewService.create(createReviewDto, userId);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Obtener todas las reseñas' })
  @ApiResponse({
    status: 200,
    description: 'Lista de reseñas obtenida exitosamente',
  })
  findAll() {
    return this.reviewService.findAll();
  }

  @Get('by-service/:serviceId')
  @Public()
  @ApiOperation({ summary: 'Obtener reseñas de un servicio' })
  @ApiResponse({
    status: 200,
    description: 'Reseñas del servicio obtenidas exitosamente',
  })
  findByService(@Param('serviceId') serviceId: string) {
    return this.reviewService.findByService(serviceId);
  }

  @Get('by-client/:clientId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Obtener reseñas de un cliente (Solo Admin)' })
  @ApiResponse({
    status: 200,
    description: 'Reseñas del cliente obtenidas exitosamente',
  })
  findByClient(@Param('clientId') clientId: string) {
    return this.reviewService.findByClient(clientId);
  }

  @Get('my-reviews')
  @ApiOperation({ summary: 'Obtener mis reseñas' })
  @ApiResponse({
    status: 200,
    description: 'Mis reseñas obtenidas exitosamente',
  })
  findMyReviews(@Request() req) {
    return this.reviewService.findByClient(req.user.sub);
  }

  @Get('service-stats/:serviceId')
  @Public()
  @ApiOperation({ summary: 'Obtener estadísticas de reseñas de un servicio' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
  })
  getServiceStats(@Param('serviceId') serviceId: string) {
    return this.reviewService.getServiceStats(serviceId);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Obtener una reseña por ID' })
  @ApiResponse({ status: 200, description: 'Reseña obtenida exitosamente' })
  @ApiResponse({ status: 404, description: 'Reseña no encontrada' })
  findOne(@Param('id') id: string) {
    return this.reviewService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una reseña' })
  @ApiResponse({ status: 200, description: 'Reseña actualizada exitosamente' })
  @ApiResponse({ status: 404, description: 'Reseña no encontrada' })
  update(@Param('id') id: string, @Body() updateReviewDto: UpdateReviewDto) {
    return this.reviewService.update(id, updateReviewDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar una reseña (Solo Admin)' })
  @ApiResponse({ status: 200, description: 'Reseña eliminada exitosamente' })
  @ApiResponse({ status: 404, description: 'Reseña no encontrada' })
  remove(@Param('id') id: string) {
    return this.reviewService.remove(id);
  }
}
