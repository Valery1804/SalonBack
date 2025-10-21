import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity('services')
@Unique(['providerId', 'name'])
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  price: number;

  @Column('int')
  durationMinutes: number;

  @Column({ default: true })
  isActive: boolean;

  @Column('uuid', { nullable: true })
  providerId: string | null;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'providerId' })
  provider: User;

  @Column('float', { default: 0 })
  averageRating: number;

  @Column('int', { default: 0 })
  reviewsCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
