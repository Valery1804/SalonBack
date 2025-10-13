import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Salon Backend API')
    .setDescription('API completa para el sistema de salon con autenticacion JWT')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const docsPath = join(process.cwd(), 'swagger-spec.json');
  writeFileSync(docsPath, JSON.stringify(document, null, 2), { encoding: 'utf8' });
  console.log(`Swagger JSON generado en: ${docsPath}`);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`Aplicacion ejecutandose en: http://localhost:${port}`);
  console.log(`Documentacion Swagger en: http://localhost:${port}/api/docs`);
}

bootstrap();
