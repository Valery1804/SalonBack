import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleService } from './schedule.service';
import { ScheduleController } from './schedule.controller';
import { Schedule } from './entities/schedule.entity';
import { ScheduleBlock } from './entities/schedule-block.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Schedule, ScheduleBlock])],
  controllers: [ScheduleController],
  providers: [ScheduleService],
  exports: [ScheduleService],
})
export class ScheduleModule {}
