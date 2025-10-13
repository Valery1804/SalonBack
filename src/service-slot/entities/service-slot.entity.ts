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
import { User } from '../../user/entities/user.entity';
import { Service } from '../../service/entities/service.entity';
import { ServiceSlotStatus } from '../../common/enums/service-slot-status.enum';
import { ProviderType } from '../../common/enums/provider-type.enum';

@Entity('service_slots')
@Index(['providerId', 'date'])
@Index(['serviceId', 'date'])
export class ServiceSlot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  providerId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'providerId' })
  provider: User;

  @Column({
    type: 'enum',
    enum: ProviderType,
  })
  providerType: ProviderType;

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
