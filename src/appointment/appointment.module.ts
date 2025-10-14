import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentService } from './appointment.service';
import { AppointmentController } from './appointment.controller';
import { Appointment } from './entities/appointment.entity';
import { ServiceModule } from '../service/service.module';
import { ScheduleModule } from '../schedule/schedule.module';
import { ServiceSlot } from '../service-slot/entities/service-slot.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment, ServiceSlot]),
    ServiceModule,
    ScheduleModule,
  ],
  controllers: [AppointmentController],
  providers: [AppointmentService],
  exports: [AppointmentService],
})
export class AppointmentModule {}
