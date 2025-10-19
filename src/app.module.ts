import { Module } from '@nestjs/common';
// import { ConfigModule } from '@nestjs/config';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ReportsModule } from './reports/reports.module';

// Importaciones comentadas hasta que se creen los módulos
// import { AuthModule } from './auth/auth.module';
// import { UserModule } from './user/user.module';
// import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
// import { ServiceModule } from './service/service.module';
// import { ScheduleModule } from './schedule/schedule.module';
// import { AppointmentModule } from './appointment/appointment.module';
// import { ReviewModule } from './review/review.module';
// import { ServiceSlotModule } from './service-slot/service-slot.module';

@Module({
  imports: [
    // ConfigModule.forRoot({
    //   isGlobal: true,
    // }),
    // Comentado hasta instalar TypeORM y configurar la base de datos
    // TypeOrmModule.forRoot({
    //   type: 'postgres',
    //   host: process.env.DB_HOST || 'localhost',
    //   port: parseInt(process.env.DB_PORT) || 5432,
    //   username: process.env.DB_USERNAME || 'postgres',
    //   password: process.env.DB_PASSWORD || 'password',
    //   database: process.env.DB_DATABASE || 'salon_db',
    //   entities: [__dirname + '/**/*.entity{.ts,.js}'],
    //   synchronize: process.env.NODE_ENV !== 'production',
    //   logging: process.env.NODE_ENV === 'development',
    // }),
    ReportsModule,
    // Módulos comentados hasta que se creen
    // AuthModule,
    // UserModule,
    // ServiceModule,
    // ScheduleModule,
    // AppointmentModule,
    // ReviewModule,
    // ServiceSlotModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Guard comentado hasta que se implemente la autenticación
    // {
    //   provide: APP_GUARD,
    //   useClass: JwtAuthGuard,
    // },
  ],
})
export class AppModule {}
