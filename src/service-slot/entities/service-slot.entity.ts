import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Service } from '../../service/entities/service.entity';
import { User } from '../../user/entities/user.entity';
import { ServiceSlotStatus } from '../../common/enums/service-slot-status.enum';

@Entity('service_slots')
@Index(['serviceId', 'date'])
export class ServiceSlot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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
    enum: ServiceSlotStatus,
    default: ServiceSlotStatus.AVAILABLE,
  })
  status: ServiceSlotStatus;

  @Column('uuid', { nullable: true })
  clientId: string | null;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'clientId' })
  client: User | null;

  @Column('text', { nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
