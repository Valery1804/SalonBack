import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceSlotService } from './service-slot.service';
import { ServiceSlotController } from './service-slot.controller';
import { ServiceSlot } from './entities/service-slot.entity';
import { Service } from '../service/entities/service.entity';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceSlot, Service, User])],
  controllers: [ServiceSlotController],
  providers: [ServiceSlotService],
  exports: [ServiceSlotService],
})
export class ServiceSlotModule {}
