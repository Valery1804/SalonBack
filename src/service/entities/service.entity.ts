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

  @Column('decimal', { precision: 10, scale: 2 })
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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
