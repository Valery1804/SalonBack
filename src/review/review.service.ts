import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Review } from './entities/review.entity';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
  ) {}

  async create(createReviewDto: CreateReviewDto, clientId: string): Promise<Review> {
    const review = this.reviewRepository.create({
      ...createReviewDto,
      clientId,
    });

    return this.reviewRepository.save(review);
  }

  async findAll(): Promise<Review[]> {
    return this.reviewRepository.find({
      relations: ['client', 'service', 'appointment'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByService(serviceId: string): Promise<Review[]> {
    return this.reviewRepository.find({
      where: { serviceId },
      relations: ['client', 'service'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByClient(clientId: string): Promise<Review[]> {
    return this.reviewRepository.find({
      where: { clientId },
      relations: ['client', 'service'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['client', 'service', 'appointment'],
    });

    if (!review) {
      throw new NotFoundException('Reseña no encontrada');
    }

    return review;
  }

  async update(id: string, updateReviewDto: UpdateReviewDto): Promise<Review> {
    const review = await this.findOne(id);

    await this.reviewRepository.update(id, updateReviewDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const review = await this.findOne(id);
    await this.reviewRepository.remove(review);
  }

  async getServiceAverageRating(serviceId: string): Promise<number> {
    const result = await this.reviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'average')
      .where('review.serviceId = :serviceId', { serviceId })
      .getRawOne();

    return result.average ? parseFloat(result.average) : 0;
  }

  async getServiceStats(serviceId: string) {
    const reviews = await this.findByService(serviceId);
    const average = await this.getServiceAverageRating(serviceId);

    return {
      totalReviews: reviews.length,
      averageRating: average,
      ratings: {
        five: reviews.filter((r) => r.rating === 5).length,
        four: reviews.filter((r) => r.rating === 4).length,
        three: reviews.filter((r) => r.rating === 3).length,
        two: reviews.filter((r) => r.rating === 2).length,
        one: reviews.filter((r) => r.rating === 1).length,
      },
    };
  }
}
