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
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  clientId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'clientId' })
  client: User;

  @Column('uuid')
  staffId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'staffId' })
  staff: User;

  @Column('uuid')
  serviceId: string;

  @ManyToOne(() => Service, { eager: true })
  @JoinColumn({ name: 'serviceId' })
  service: Service;

  @Column('date')
  date: Date;

  @Column('time')
  startTime: string;

  @Column('time')
  endTime: string;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDIENTE,
  })
  status: AppointmentStatus;

  @Column('text', { nullable: true })
  notes: string;

  @Column('text', { nullable: true })
  cancellationReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
