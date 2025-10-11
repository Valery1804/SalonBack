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
import { Service } from '../../service/entities/service.entity';
import { Appointment } from '../../appointment/entities/appointment.entity';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  clientId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'clientId' })
  client: User;

  @Column('uuid')
  serviceId: string;

  @ManyToOne(() => Service, { eager: true })
  @JoinColumn({ name: 'serviceId' })
  service: Service;

  @Column('uuid', { nullable: true })
  appointmentId: string;

  @ManyToOne(() => Appointment, { nullable: true })
  @JoinColumn({ name: 'appointmentId' })
  appointment: Appointment;

  @Column('int')
  rating: number; // 1-5

  @Column('text', { nullable: true })
  comment: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
