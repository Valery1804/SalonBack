import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity('schedule_blocks')
export class ScheduleBlock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { nullable: true })
  staffId: string;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'staffId' })
  staff: User;

  @Column('date')
  date: Date;

  @Column('time')
  startTime: string;

  @Column('time')
  endTime: string;

  @Column('text', { nullable: true })
  reason: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
