import { ApiProperty } from '@nestjs/swagger';
import { Service } from '../entities/service.entity';
import { UserResponseDto } from '../../user/dto/user-response.dto';

export class ServiceResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  durationMinutes: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ nullable: true })
  providerId: string | null;

  @ApiProperty({ type: () => UserResponseDto, nullable: true })
  provider?: UserResponseDto | null;

  @ApiProperty()
  averageRating: number;

  @ApiProperty()
  reviewsCount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(service: Service) {
    this.id = service.id;
    this.name = service.name;
    this.description = service.description;
    this.price = service.price;
    this.durationMinutes = service.durationMinutes;
    this.isActive = service.isActive;
    this.providerId = service.providerId;
    this.provider = service.provider
      ? new UserResponseDto(service.provider)
      : null;
    this.averageRating = service.averageRating;
    this.reviewsCount = service.reviewsCount;
    this.createdAt = service.createdAt;
    this.updatedAt = service.updatedAt;
  }
}
