# Setup del Backend - Salon Management System

## Dependencias Necesarias

Para que el backend funcione completamente, necesitas instalar las siguientes dependencias:

### 1. Dependencias Básicas de NestJS
```bash
npm install @nestjs/config @nestjs/typeorm typeorm pg
```

### 2. Dependencias de Autenticación
```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt bcryptjs
npm install -D @types/passport-jwt @types/bcryptjs
```

### 3. Dependencias de Validación
```bash
npm install class-validator class-transformer
```

### 4. Dependencias para Reportes (Opcional)
```bash
npm install puppeteer exceljs
npm install -D @types/puppeteer
```

## Configuración de Base de Datos

1. **Instalar PostgreSQL** en tu sistema
2. **Crear una base de datos** llamada `salon_db`
3. **Crear un archivo `.env`** en la raíz del proyecto:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=tu_password
DB_DATABASE=salon_db

# JWT
JWT_SECRET=tu_jwt_secret_muy_seguro
JWT_EXPIRES_IN=7d

# App
NODE_ENV=development
PORT=3000
```

## Pasos para Activar Funcionalidades

### 1. Después de instalar las dependencias, descomenta en `app.module.ts`:

```typescript
// Descomenta estas líneas:
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';

// Y en la sección @Module:
ConfigModule.forRoot({
  isGlobal: true,
}),
TypeOrmModule.forRoot({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'salon_db',
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
}),
```

### 2. Crear los módulos faltantes:

Los siguientes módulos están referenciados pero no existen aún:
- `AuthModule`
- `UserModule` 
- `ServiceModule`
- `ScheduleModule`
- `AppointmentModule`
- `ReviewModule`
- `ServiceSlotModule`

### 3. Crear entidades de base de datos

Necesitarás crear las entidades para:
- User
- Service
- Appointment
- Review
- Schedule
- ServiceSlot

## Estado Actual

✅ **Funcionando:**
- Módulo de Reportes (`ReportsModule`)
- Estructura básica del proyecto
- Endpoints de reportes con datos mock

⏳ **Pendiente:**
- Instalación de dependencias
- Configuración de base de datos
- Creación de módulos faltantes
- Implementación de autenticación

## Comandos Rápidos

```bash
# Instalar todas las dependencias básicas
npm install @nestjs/config @nestjs/typeorm typeorm pg @nestjs/jwt @nestjs/passport passport passport-jwt bcryptjs class-validator class-transformer

# Instalar tipos de desarrollo
npm install -D @types/passport-jwt @types/bcryptjs

# Ejecutar el servidor
npm run start:dev
```

Una vez instaladas las dependencias, descomenta las líneas en `app.module.ts` y el backend debería funcionar correctamente.
