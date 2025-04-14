# NestJS + Microservicios: Aplicaciones escalables y modulares (parte 9)

- En este documento vamos a documentar el curso [NestJS + Microservicios: Aplicaciones escalables y modulares de Udemy](https://www.udemy.com/course/nestjs-microservicios)

## 09 Autenticación (Auth Microservice)

### 09.01 Introducción

- Vamos a crear un microservicio para gestionar la autenticación de los usuarios.
- Para ello vamos a utilizar un nuevo microservicio de autenticación en NestJS.

### 09.02 Creación del microservicio auth-ms

- Vamos a crear el microservicio auth-ms usando el comando `nest new`.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App$ 
nest new auth-ms --skip-git
✨  We will scaffold your app in a few seconds..

✔ Which package manager would you ❤️ to use? npm
CREATE auth-ms/.prettierrc (51 bytes)
CREATE auth-ms/README.md (5020 bytes)
CREATE auth-ms/eslint.config.mjs (856 bytes)
CREATE auth-ms/nest-cli.json (171 bytes)
CREATE auth-ms/package.json (2033 bytes)
CREATE auth-ms/tsconfig.build.json (97 bytes)
CREATE auth-ms/tsconfig.json (544 bytes)
CREATE auth-ms/src/app.controller.ts (274 bytes)
CREATE auth-ms/src/app.module.ts (249 bytes)
CREATE auth-ms/src/app.service.ts (142 bytes)
CREATE auth-ms/src/main.ts (228 bytes)
CREATE auth-ms/src/app.controller.spec.ts (617 bytes)
CREATE auth-ms/test/jest-e2e.json (183 bytes)
CREATE auth-ms/test/app.e2e-spec.ts (674 bytes)

✔ Installation in progress... ☕

🚀  Successfully created project auth-ms
👉  Get started with the following commands:

$ cd auth-ms
$ npm run start

                                         
                          Thanks for installing Nest 🙏
                 Please consider donating to our open collective
                        to help us maintain this package.
                                         
                                         
               🍷  Donate: https://opencollective.com/nest
```

- Como hemos usado el flag `--skip-git` no se crea el .gitignore, por lo que lo creamos nosotros.
- Lo podemos copiar del directorio 02-Products-App/products-ms/.gitignore

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/
cp products-ms/.gitignore auth-ms/.gitignore
```

- Vamos a probar el proyecto para ver que todo está bien.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/
cd auth-ms
~/Training/microservices/nestjs-microservicios/02-Products-App/auth-ms$ 
npm run start

> auth-ms@0.0.1 start
> nest start

[Nest] 32393  - 13/04/2025, 05:58:36     LOG [NestFactory] Starting Nest application...
[Nest] 32393  - 13/04/2025, 05:58:36     LOG [InstanceLoader] AppModule dependencies initialized +5ms
[Nest] 32393  - 13/04/2025, 05:58:36     LOG [RoutesResolver] AppController {/}: +3ms
[Nest] 32393  - 13/04/2025, 05:58:36     LOG [RouterExplorer] Mapped {/, GET} route +2ms
[Nest] 32393  - 13/04/2025, 05:58:36     LOG [NestApplication] Nest application successfully started +1ms
```

### 09.03 Instalación de los paquetes npm necesarios

- Vamos a instalar el paquete de `@nestjs/jwt` para la gestión de JWT.
- Instalaremos el paquete `dotenv` para la lectura del archivo `.env`.
- Vamos a utilizar el paquete `joi` para validar el archivo `.env`.
- Vamos a instalar los paquetes de `class-transformer` y `class-validator` para que funcione correctamente las validaciones de los datos de los DTOs.
- Vamos a instalar el paquete `@nestjs/microservices` para que funcione correctamente el microservicio.
- Vamos a instalar el paquete `nats` para que funcione correctamente la conexión con otros microservicios.
- Vamos a instalar el paquete `@prisma/client` para que funcione correctamente la conexión con la base de datos.
- Vamos a instalar el paquete `bcrypt` para que funcione correctamente el hash de las contraseñas.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/auth-ms$
npm i @nestjs/jwt dotenv joi class-transformer class-validator @nestjs/microservices nats @prisma/client bcrypt
npm warn deprecated npmlog@5.0.1: This package is no longer supported.
npm warn deprecated rimraf@3.0.2: Rimraf versions prior to v4 are no longer supported
npm warn deprecated are-we-there-yet@2.0.0: This package is no longer supported.
npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
npm warn deprecated gauge@3.0.2: This package is no longer supported.

added 74 packages, and audited 901 packages in 6s

154 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

- Vamos a instalar el paquete `prisma` en devDependencies para que funcione correctamente el ORM.
- Vamos a instalar el paquete `@types/bcrypt` en devDependencies para que funcione correctamente el hash de las contraseñas.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/auth-ms$
npm i -D prisma @types/bcrypt

added 11 packages, and audited 912 packages in 6s

154 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

### 09.04 Creación de un servicio de configuración

#### 09.04.01 Creación del archivo .env

- Vamos a crear el archivo `.env` en el directorio `02-Products-App/auth-ms` que será el encargado de almacenar las variables de entorno.

> 02-Products-App/auth-ms/.env.template

```text
PORT=3004
# NATS_SERVERS="nats://localhost:4222,nats://localhost:4223"
NATS_SERVERS="nats://localhost:4222"
AUTH_DATABASE_URL=mongodb+srv://***:*****@auth-microservice-db.8bpm1ia.mongodb.net/AuthDB
JWT_SECRET=OtroStringSeguroIriaAQUI
```

#### 09.04.02 Creación del documento envs.ts

- Vamos a crear el documento `envs.ts` en el directorio `02-Products-App/auth-ms/src/config` que será el encargado de leer y validar el archivo `.env`.

```bash
import 'dotenv/config';

import * as joi from 'joi';

interface EnvVars {
  PORT: number;
  NATS_SERVERS: string[];
  JWT_SECRET: string;
}

const envsSchema = joi
  .object({
    PORT: joi.number().required(),
    NATS_SERVERS: joi.array().items(joi.string()).required(),
    JWT_SECRET: joi.string().required(),
  })
  .unknown(true);

const { error, value } = envsSchema.validate({
  ...process.env,
  NATS_SERVERS: process.env.NATS_SERVERS?.split(','),
});

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const envVars: EnvVars = value;

export const envs = {
  port: envVars.PORT,
  natsServers: envVars.NATS_SERVERS,
  jwtSecret: envVars.JWT_SECRET,
};
```

#### 09.04.03 Modificación del documento main.ts

- Vamos a modificar el documento `main.ts` en el directorio `02-Products-App/auth-ms/src` para que utilice el servicio de configuración.

```bash
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { envs } from './config/envs';

async function bootstrap() {
  const logger = new Logger('Auth-ms');
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  await app.listen(envs.port);

  logger.log(`Auth Microservice running on port ${envs.port}`);

}
bootstrap();
```

- Vamos a asegurarnos de que el microservicio de auth-ms funciona y está escuchando en el puerto 3004.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/auth-ms$ 
npm run start

> auth-ms@0.0.1 start
> nest start

[Nest] 45558  - 13/04/2025, 06:16:12     LOG [NestFactory] Starting Nest application...
[Nest] 45558  - 13/04/2025, 06:16:12     LOG [InstanceLoader] AppModule dependencies initialized +7ms
[Nest] 45558  - 13/04/2025, 06:16:12     LOG [NestApplication] Nest application successfully started +134ms
[Nest] 45558  - 13/04/2025, 06:16:12     LOG [Auth-ms] Auth Microservice running on port 3004
```

### 09.05 Creación del recurso Auth

- Vamos a crear el recurso Auth en el directorio `02-Products-App/auth-ms/src/auth` usando el comando `nest g resource auth`.
- Debemos seleccionar Microservice (non-HTTP) como transporte.
- No debemos seleccionar la opción de generar CRUD.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/auth-ms$ 
nest g resource auth --no-spec
✔ What transport layer do you use? Microservice (non-HTTP)
✔ Would you like to generate CRUD entry points? No
CREATE src/auth/auth.controller.ts (198 bytes)
CREATE src/auth/auth.module.ts (241 bytes)
CREATE src/auth/auth.service.ts (88 bytes)
UPDATE package.json (2388 bytes)
UPDATE src/app.module.ts (191 bytes)
✔ Packages installed successfully.
```

### 09.06 Hacer que el proyecto `auth-ms` sea un microservicio

#### 09.06.01 Modificación del archivo `main.ts`

- Vamos a modificar el archivo `main.ts` en el directorio `02-Products-App/auth-ms/src` para que utilice el servicio de configuración.

> 02-Products-App/auth-ms/src/main.ts

```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { envs } from './config/envs';
import { MicroserviceOptions } from '@nestjs/microservices';
import { Transport } from '@nestjs/microservices';

async function bootstrap() {
  const logger = new Logger('Auth-ms');
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.NATS,
      options: {
        servers: envs.natsServers,
      },
    },
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen();

  // No es necesario especificar el puerto, ya que se configura en el archivo docker-compose.yaml
  logger.log(`Auth Microservice running on port ${envs.port}`);
}
bootstrap();
```

#### 09.06.02 Tenemos que modificar el archivo `.env` del root para incluir las variables de configuración del microservicio `auth-ms`

> 02-Products-App/.env

```text
# ...

AUTH_MS_PORT=3004
AUTH_DATABASE_URL=mongodb+srv://***:*****@auth-microservice-db.8bpm1ia.mongodb.net/AuthDB
JWT_SECRET=OtroStringSeguroIriaAQUI
```

#### 09.06.03 Tenemos que modificar el archivo `docker-compose.yaml` del root para incluir el microservicio `auth-ms`

> 02-Products-App/docker-compose.yaml

```yaml
.
  auth-ms:
    container_name: auth-ms
    build: ./auth-ms
    volumes:
      - ./auth-ms/src:/usr/src/app/src
    command: npm run start:dev    
    ports:
      - ${AUTH_MS_PORT}:${AUTH_MS_PORT}
    environment:
      - PORT=${AUTH_MS_PORT}
      - NATS_SERVERS=${NATS_SERVERS}
      - AUTH_DATABASE_URL=${AUTH_DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
.      
```

### 09.06.04 Copiar y actualizar los archivos `Dockerfile` y `.dockerignore` del microservicio de orders-ms en el directorio `02-Products-App/auth-ms`

- Vamos a copiar el archivo `Dockerfile` y `.dockerignore` del microservicio de orders-ms en el directorio `02-Products-App/auth-ms` y luego actualizar el archivo `Dockerfile` para que el puerto sea el 3004.

> 02-Products-App/auth-ms/Dockerfile

```dockerfile
FROM node:22-alpine

WORKDIR /usr/src/app

COPY package.json ./
COPY package-lock.json ./

RUN npm install

COPY . .

EXPOSE 3003
```

> 02-Products-App/payments-ms/.dockerignore

```text
dist/
node_modules/
.env
.vscode/
```

### 09.06.05 Actualizar el auth.controller.ts para poner los endpoints de login iniciales

#### 09.06.05.01 Creación de los DTOs que se usarán en el recurso Auth dentro de `auth-ms`

- Vamos a crear los DTOs que se usarán en el recurso Auth dentro de `auth-ms`.

> 02-Products-App/auth-ms/src/auth/dto/register-user.dto.ts

```ts
import { IsEmail, IsString, IsStrongPassword } from 'class-validator';

export class RegisterUserDto {
  @IsString()
  name: string;

  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  @IsStrongPassword()
  password: string;
}
```

> 02-Products-App/auth-ms/src/auth/dto/login-user.dto.ts

```ts
import { IsEmail, IsString, IsStrongPassword } from 'class-validator';

export class LoginUserDto {
  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  @IsStrongPassword()
  password: string;
}
```

#### 09.06.05.02 Modificación del archivo `auth.controller.ts` para que use los DTOs y los devuelva al cliente

> 02-Products-App/auth-ms/src/auth/auth.controller.ts

```ts
import { Controller } from '@nestjs/common';
import { AuthService } from './auth.service';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}


  @MessagePattern('auth.register.user')
  registerUser(@Payload() registerUserDto: RegisterUserDto) {
    return registerUserDto;
  }

  @MessagePattern('auth.login.user')
  loginUser(@Payload() loginUserDto: LoginUserDto) {
    return loginUserDto;
  }

  @MessagePattern('auth.verify.user')
  verifyToken() {
    return 'verify token'
  }  
}
```

### 09.06.06 Asegurarnos de que docker-compose funciona correctamente con el microservicio de auth-ms

- Tenemos que asegurarnos que docker-compose funciona correctamente con el microservicio de auth-ms.
- La primera vez hay que añadir el parámetro `--build` al comando `docker-compose up` para que se construya el microservicio.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App$ 
docker-compose up --build
```

#### 09.06.07 Asegurarnos de que docker-compose funciona correctamente con el microservicio de auth-ms

- Una vez que se han levantado los microservicios, incluyendo el de auth-ms, podemos ver si el microservicio está funcionando correctamente accediendo, ya sea a través de `Docker Desktop` o ejecutando el siguiente comando.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App$ 
docker-compose logs -f auth-ms

[5:02:58 AM] Starting compilation in watch mode...
auth-ms           | 
auth-ms           | [5:03:03 AM] Found 0 errors. Watching for file changes.
auth-ms           | 
auth-ms           | [Nest] 28  - 04/13/2025, 5:03:04 AM     LOG [NestFactory] Starting Nest application...
auth-ms           | [Nest] 28  - 04/13/2025, 5:03:04 AM     LOG [InstanceLoader] AppModule dependencies initialized +27ms
auth-ms           | [Nest] 28  - 04/13/2025, 5:03:04 AM     LOG [InstanceLoader] AuthModule dependencies initialized +1ms
auth-ms           | [Nest] 28  - 04/13/2025, 5:03:04 AM     LOG [NestMicroservice] Nest microservice successfully started +485ms
auth-ms           | [Nest] 28  - 04/13/2025, 5:03:04 AM     LOG [Auth-ms] Auth Microservice running on port 3004
```

### 09.07 Creación de un nuevo recurso en el microservicio de `client-gateway`

- Vamos a crear un nuevo recurso en el microservicio de `client-gateway` usando el comando `nest g res auth --no-spec`.
- Debemos seleccionar HTTP como transporte.
- No debemos seleccionar la opción de generar CRUD.

#### 09.07.01 Creación del recurso Auth en el microservicio de `client-gateway`

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/client-gateway$
nest g res auth --no-spec
✔ What transport layer do you use? REST API
✔ Would you like to generate CRUD entry points? No
CREATE src/auth/auth.controller.ts (204 bytes)
CREATE src/auth/auth.module.ts (241 bytes)
CREATE src/auth/auth.service.ts (88 bytes)
UPDATE src/app.module.ts (404 bytes)
```

- No vamos a usar el AuthService, por lo que podemos eliminar el archivo `auth.service.ts` y debemos modificar el archivo `auth.controller.ts` para que no use el AuthService. Lo mismo con el archivo `auth.module.ts`.

#### 09.07.02 Creación de los DTOs que se usarán en el recurso Auth dentro de `client-gateway`

- Vamos a crear los DTOs que se usarán en el recurso Auth dentro de `client-gateway`.

> 02-Products-App/client-gateway/src/auth/dto/register-user.dto.ts

```ts
import { IsEmail, IsString, IsStrongPassword } from 'class-validator';

export class RegisterUserDto {
  @IsString()
  name: string;

  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  @IsStrongPassword()
  password: string;
}
```

> 02-Products-App/client-gateway/src/auth/dto/login-user.dto.ts

```ts
import { IsEmail, IsString, IsStrongPassword } from 'class-validator';

export class LoginUserDto {
  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  @IsStrongPassword()
  password: string;
}
```

#### 09.07.03 Modificación del archivo `auth.controller.ts` para que use los DTOs y llame al microservicio de `auth-ms`

- Vamos a modificar el archivo `auth.controller.ts` para que use los DTOs y llame al microservicio de `auth-ms`.

> 02-Products-App/client-gateway/src/auth/auth.controller.ts

```ts
import {
  Controller,
  Inject,
  Post,
  Body,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { ClientProxy } from '@nestjs/microservices';
import { RegisterUserDto } from './dto/register-user.dto';
import { NATS_SERVICE } from 'src/config/services';
import { LoginUserDto } from './dto/login-user.dto';
import { catchError } from 'rxjs';

@Controller('auth')
export class AuthController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  @Post('register')
  registerUser(@Body() registerUserDto: RegisterUserDto) {
    return this.client.send('auth.register.user', registerUserDto).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Post('login')
  loginUser(@Body() loginUserDto: LoginUserDto) {
    return this.client.send('auth.login.user', loginUserDto).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }
}
```

#### 09.07.04 Modificación del archivo `app.module.ts` para que use el microservicio de `auth-ms`

- Vamos a modificar el archivo `app.module.ts` para que use el microservicio de `auth-ms`.

> 02-Products-App/client-gateway/src/app.module.ts

```ts
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { NatsModule } from 'src/transports/nats.module';

@Module({
  controllers: [AuthController],
  imports: [NatsModule],
})
export class AuthModule {}
```

#### 09.07.05 Creación del documento `auth.http` para crear la llamada a los endpoints que nos sirver para probar el microservicio de `auth-ms`

- Vamos a crear el documento `auth.http` para crear la llamada a los endpoints que nos sirver para probar el microservicio de `auth-ms`.

> 02-Products-App/client-gateway/src/auth/auth.http

```http
@url = http://localhost:3000/api/auth

### Crear un nuevo usuario
POST {{url}}/register
Content-Type: application/json

{
  "name": "Usuario XXX",
  "email": "usuario@gmail.com",
  "password": "1234567!02JSJSJSssswd"
}

### Iniciar sesión
POST {{url}}/login
Content-Type: application/json

{
  "email": "usuario@gmail.com",
  "password": "1234567!02JSJSJSssswd"
}
```

- Tenemos que asegurarnos de que cuando se ejecuta el endpoint `### Crear un nuevo usuario` recibimos el mismo objeto que mandamos en el endpoint `### Crear un nuevo usuario` del microservicio de `auth-ms`.

```json
HTTP/1.1 201 Created
X-Powered-By: Express
Content-Type: text/html; charset=utf-8
Content-Length: 13
ETag: W/"d-wTt5/FfSTEtgBVd4DeCCORm2p0Q"
Date: Sun, 13 Apr 2025 10:13:20 GMT
Connection: close

{
  "name": "Usuario XXX",
  "email": "usuario@gmail.com",
  "password": "1234567!02JSJSJSssswd"
}
```

- Tenemos que asegurarnos de que cuando se ejecuta el endpoint `### Iniciar sesión` recibimos el mismo objeto que mandamos   en el endpoint `### Crear un nuevo usuario` del microservicio de `auth-ms`.

```json
HTTP/1.1 201 Created
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 64
ETag: W/"40-0lW6MI6o3aKcNMuIJ4jgKu/sJEs"
Date: Sun, 13 Apr 2025 10:40:11 GMT
Connection: close

{
  "email": "usuario@gmail.com",
  "password": "1234567!02JSJSJSssswd"
}
```

### 09.08 Aprovisionar una base de datos en MongoDB para guardar la información de los usuarios en el microservicio de `auth-ms`

#### 09.08.01 Creación de la base de datos en MongoDB

- Podemos utilizar `MongoDB Atlas` para provisionar una base de datos en MongoDB.
- Pero también podemos crear una base de datos localmente usando `Docker Compose`.
- Vamos a intentar hacer lo último, aunque parace ser que en las primeras versiones de Prisma con MongoDB no funcionaba correctamente.

> 02-Products-App/auth-ms/.docker-compose.yaml

```yaml
.
services:

  mongodb:
    container_name: mongodb
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: example
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 5s
      timeout: 5s
      retries: 5

  auth-ms:
    container_name: auth-ms
    depends_on:
      mongodb:
        condition: service_healthy
    build: ./auth-ms
    volumes:
      - ./auth-ms/src:/usr/src/app/src
    command: npm run start:dev    
    ports:
      - ${AUTH_MS_PORT}:${AUTH_MS_PORT}
    environment:
      - PORT=${AUTH_MS_PORT}
      - NATS_SERVERS=${NATS_SERVERS}
      - AUTH_DATABASE_URL=mongodb://root:example@mongodb:27017/auth?authSource=admin/AuthDB
      - JWT_SECRET=${JWT_SECRET}

volumes:
  postgres_data:
  mongodb_data:
```

- Tenemos que asegurarnos de que el archivo `docker-compose.yaml` de `02-Products-App` está correctamente configurado para que se pueda levantar el microservicio de `auth-ms` y que se pueda conectar a la base de datos de MongoDB.

#### 09.08.02 Creación del schema de Prisma para el microservicio de `auth-ms`

- Vamos a crear el schema de Prisma para el microservicio de `auth-ms`.

> 02-Products-App/auth-ms/prisma/schema.prisma

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

// Looking for ways to speed up your queries, or scale easily with your serverless or edge functions?
// Try Prisma Accelerate: https://pris.ly/cli/accelerate-init

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

model User {
  id       String @id @default(auto()) @map("_id") @db.ObjectId
  email    String @unique
  name     String
  password String
}
```

#### 09.08.03 Modificación del archivo `package.json` del microservicio de `auth-ms` para que se ejecute el comando `prisma migrate dev`

> 02-Products-App/auth-ms/package.json

```diff
{
  "name": "auth-ms",
  "version": "0.0.1",
  "description": "",
  "author": "",
  "private": true,
  "license": "UNLICENSED",
  "scripts": {
    "build": "nest build",
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
+   "docker:start": "prisma generate && npm run start:dev",
.
```
> Notice: We cnnot use `prisma migrate dev` because we are using MongoDB and as it is not a relational database, we cannot use migrations.It is only used to generate the Prisma Client and provide type safety in our application.

#### 09.08.04 Modificación del archivo de `docker-compose.yaml` para que se ejecute el comando `docker:start`

> 02-Products-App/docker-compose.yaml

```diff
.
  auth-ms:
    container_name: auth-ms
    depends_on:
      mongodb:
        condition: service_healthy
    build: ./auth-ms
    volumes:
      - ./auth-ms/src:/usr/src/app/src
+    command: npm run docker:start
.
```

#### 09.08.05 Tenemos que asegurarnos que el microservicio `auth-ms` se ha levantado correctamente

- Vamos a ejecutar el comando `docker-compose logs -f auth-ms` para asegurarnos de que el microservicio `auth-ms` se ha levantado correctamente.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App$ 
docker-compose logs -f auth-ms
[11:37:22 AM] Starting compilation in watch mode...
auth-ms           | 
auth-ms           | [11:37:54 AM] Found 0 errors. Watching for file changes.
auth-ms           | 
auth-ms           | [Nest] 76  - 04/13/2025, 11:37:59 AM     LOG [NestFactory] Starting Nest application...
auth-ms           | [Nest] 76  - 04/13/2025, 11:37:59 AM     LOG [InstanceLoader] AppModule dependencies initialized +127ms
auth-ms           | [Nest] 76  - 04/13/2025, 11:37:59 AM     LOG [InstanceLoader] AuthModule dependencies initialized +3ms
auth-ms           | [Nest] 76  - 04/13/2025, 11:38:00 AM     LOG [NestMicroservice] Nest microservice successfully started +1006ms
auth-ms           | [Nest] 76  - 04/13/2025, 11:38:00 AM     LOG [Auth-ms] Auth Microservice running on port 3004
```

#### 09.08.06 Modificar el archivo `auth.service.ts` para que se pueda conectar a la base de datos de MongoDB

- Vamos a modificar el archivo `auth.service.ts` para que se pueda conectar a la base de datos de MongoDB.

> 02-Products-App/auth-ms/src/auth/auth.service.ts

```ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaClient } from '@prisma/client';

import * as bcrypt from 'bcrypt';

import { LoginUserDto, RegisterUserDto } from './dto';
import { envs } from 'src/config';

@Injectable()
export class AuthService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  onModuleInit() {
    this.$connect();
    this.logger.log('MongoDB connected');
  }

  async registerUser(registerUserDto: RegisterUserDto) {
    const { email, name, password } = registerUserDto;

    try {
      const user = await this.user.findUnique({
        where: {
          email: email,
        },
      });

      if (user) {
        throw new RpcException({
          status: 400,
          message: 'User already exists',
        });
      }

      const newUser = await this.user.create({
        data: {
          email: email,
          password: bcrypt.hashSync(password, 10), // TODO: encriptar / hash
          name: name,
        },
      });

      const { password: __, ...rest } = newUser;

      return {
        user: rest,
        // token: await this.signJWT(rest),
      };
    } catch (error) {
      throw new RpcException({
        status: 400,
        message: error.message,
      });
    }
  }

  async loginUser(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;

    try {
      const user = await this.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new RpcException({
          status: 400,
          message: 'User/Password not valid',
        });
      }

      const isPasswordValid = bcrypt.compareSync(password, user.password);

      if (!isPasswordValid) {
        throw new RpcException({
          status: 400,
          message: 'User/Password not valid',
        });
      }

      const { password: __, ...rest } = user;

      return {
        user: rest,
        // token: await this.signJWT(rest),
      };
    } catch (error) {
      throw new RpcException({
        status: 400,
        message: error.message,
      });
    }
  }
}
```

#### 09.08.07 Modificar el archivo `auth.controller.ts` para que use el microservicio de `auth-ms`

- Vamos a modificar el archivo `auth.controller.ts` para que use el microservicio de `auth-ms`.

> 02-Products-App/auth-ms/src/auth/auth.controller.ts 

```ts
import { Controller } from '@nestjs/common';
import { AuthService } from './auth.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern('auth.register.user')
  registerUser(@Payload() registerUserDto: RegisterUserDto) {
    return this.authService.registerUser(registerUserDto);
  }

  @MessagePattern('auth.login.user')
  loginUser(@Payload() loginUserDto: LoginUserDto) {
    return this.authService.loginUser(loginUserDto);
  }

  @MessagePattern('auth.verify.user')
  verifyToken() {
    return 'verify token'
  }  
}
```

#### 09.08.08 Configuración de MongoDB con Docker Compose para Prisma

- **Problema**

Cuando intentamos usar MongoDB con Prisma, obtenemos el siguiente error:

```bash
Invalid `prisma.user.create()` invocation:
Prisma needs to perform transactions, which requires your MongoDB server to be run as a replica set.
```

-**Solución**

Necesitamos configurar MongoDB como un conjunto de réplicas (replica set) y configurar la autenticación.

1. **Crear el archivo de clave**

Primero, creamos un archivo de clave para la autenticación:

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App$
# Eliminar el directorio si existe
rm -rf mongodb-keyfile

# Crear el archivo de clave
openssl rand -base64 756 > mongodb-keyfile

# Establecer los permisos correctos
chmod 400 mongodb-keyfile
```

2. **Configurar el servicio en docker-compose.yaml**

Actualizamos la configuración del servicio MongoDB:

```yaml
.
  mongodb:
    container_name: mongodb
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
      - ./mongodb-keyfile:/data/keyfile
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: example
    command: mongod --replSet rs0 --bind_ip_all --keyFile /data/keyfile
    healthcheck:
      test: ["CMD", "mongosh", "-u", "root", "-p", "example", "--eval", "db.adminCommand('ping')"]
      interval: 5s
      timeout: 5s
      retries: 5
.
```

3. **Inicializar el conjunto de réplicas**

Reiniciamos MongoDB e inicializamos el conjunto de réplicas:

```bash
# Detener todos los servicios
docker-compose down

# Iniciar solo MongoDB
docker-compose up -d mongodb

# Esperar 10 segundos para que MongoDB se inicie completamente
sleep 10

# Inicializar el conjunto de réplicas
docker exec -it mongodb mongosh -u root -p example --eval "rs.initiate()"
```

4. **Iniciar todos los servicios**

Finalmente, iniciamos todos los servicios:

```bash
docker-compose up -d
```

- **Explicación**

- El archivo de clave (mongodb-keyfile) se crea localmente y se monta en el contenedor
- MongoDB se configura como un conjunto de réplicas con `--replSet rs0`
- La autenticación se habilita con `--keyFile /data/keyfile`
- El conjunto de réplicas se inicializa con `rs.initiate()`
- Esta configuración permite que Prisma realice transacciones en MongoDB, que es un requisito para ciertas operaciones.

#### 09.08.09 Tenemos que asegurarnos que cuando se ejecuta el endpoint `### Crear un nuevo usuario` del microservicio de `auth-ms` se crea el usuario en la base de datos de MongoDB

- Vamos a ejecutar el endpoint `### Crear un nuevo usuario` del microservicio de `auth-ms` y vamos a comprobar que se crea el usuario en la base de datos de MongoDB.

> 02-Products-App/client-gateway/src/auth/auth.http

```http
@url = http://localhost:3000/api/auth

### Crear un nuevo usuario
POST {{url}}/register
Content-Type: application/json

{
  "name": "Usuario XXX",
  "email": "usuario@gmail.com",
  "password": "1234567!02JSJSJSssswd"
}

### Iniciar sesión
POST {{url}}/login
Content-Type: application/json

{
  "email": "usuario@gmail.com",
  "password": "1234567!02JSJSJSssswd"
}
```

- La respuesta de la petición `### Crear un nuevo usuario` es:

```json
HTTP/1.1 201 Created
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 91
ETag: W/"5b-a7ydbYzKDycy9x/NaQpwGi22qig"
Date: Sun, 13 Apr 2025 14:01:35 GMT
Connection: close

{
  "user": {
    "id": "67fbc3bf0866332999f70597",
    "email": "usuario@gmail.com",
    "name": "Usuario XXX"
  }
}
```

- Vamos a ejecutar el endpoint `### Iniciar sesión` del microservicio de `auth-ms` y vamos a comprobar que se crea el usuario en la base de datos de MongoDB.

```json
HTTP/1.1 201 Created
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 91
ETag: W/"5b-a7ydbYzKDycy9x/NaQpwGi22qig"
Date: Sun, 13 Apr 2025 14:02:56 GMT
Connection: close

{
  "user": {
    "id": "67fbc3bf0866332999f70597",
    "email": "usuario@gmail.com",
    "name": "Usuario XXX"
  }
}
```

- Podemos ver dentro de la base de datos de MongoDB que se ha creado el usuario.

![Usuario creado en MongoDB](nestjs-microservicios.09.001.png)

### 09.09 Integrar la obtención y verificación de tokens utilizando JWT

#### 09.09.01 Creación de la interfaz `JwtPayload`

- Vamos a crear la interfaz `JwtPayload` en el archivo `src/auth/interfaces/jwt-payload.interface.ts`.

> 02-Products-App/auth-ms/src/auth/interfaces/jwt-payload.interface.ts

```ts
export interface JwtPayload {
  id: string;
  email: string;
  name: string;
}
```

#### 09.09.02 Modificar el archivo `auth.service.ts` para que use la autenticacion con JWT

- Vamos a modificar el archivo `auth.service.ts` para que use la autenticacion con JWT.

> 02-Products-App/auth-ms/src/auth/auth.service.ts

```ts
import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaClient } from '@prisma/client';

import * as bcrypt from 'bcrypt';

import { LoginUserDto, RegisterUserDto } from './dto';
import { envs } from 'src/config';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly jwtService: JwtService) {
    super();
  }  

  onModuleInit() {
    this.$connect();
    this.logger.log('MongoDB connected');
  }

  async signJWT(payload: JwtPayload) {
    return this.jwtService.sign(payload);
  }

  async verifyToken(token: string) {
    try {
      const { sub, iat, exp, ...user } = this.jwtService.verify(token, {
        secret: envs.jwtSecret,
      });

      return {
        user: user,
        token: await this.signJWT(user),
      };
    } catch (error) {
      console.log(error);
      throw new RpcException({
        status: HttpStatus.UNAUTHORIZED,
        message: 'Invalid token',
      });
    }
  }

  async registerUser(registerUserDto: RegisterUserDto) {
    const { email, name, password } = registerUserDto;

    try {
      const user = await this.user.findUnique({
        where: {
          email,
        },
      });

      if (user) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'User already exists',
        });
      }

      const newUser = await this.user.create({
        data: {
          email: email,
          password: bcrypt.hashSync(password, 10),
          name: name,
        },
      });

      const { password: __, ...rest } = newUser;

      return {
        user: rest,
        token: await this.signJWT(rest),
      };
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: error.message,
      });
    }
  }

  async loginUser(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;

    try {
      const user = await this.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'User/Password not valid',
        });
      }

      const isPasswordValid = bcrypt.compareSync(password, user.password);

      if (!isPasswordValid) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'User/Password not valid',
        });
      }

      const { password: __, ...rest } = user;

      return {
        user: rest,
        token: await this.signJWT(rest),
      };
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: error.message,
      });
    }
  }
}
```

#### 09.09.03 Modificar el archivo `auth.controller.ts` para que use la autenticacion con JWT

- Vamos a modificar el archivo `auth.controller.ts` para que use la autenticacion con JWT.

> 02-Products-App/auth-ms/src/auth/auth.controller.ts

```ts
import { Controller } from '@nestjs/common';
import { AuthService } from './auth.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /*
    foo.* matches foo.bar, foo.baz, and so on, but not foo.bar.baz
    foo.*.bar matches foo.baz.bar, foo.qux.bar, and so on, but not foo.bar or foo.bar.baz
    foo.> matches foo.bar, foo.bar.baz, and so on
  */  
  @MessagePattern('auth.register.user')
  registerUser(@Payload() registerUserDto: RegisterUserDto) {
    return this.authService.registerUser(registerUserDto);
  }

  @MessagePattern('auth.login.user')
  loginUser(@Payload() loginUserDto: LoginUserDto) {
    return this.authService.loginUser(loginUserDto);
  }

  @MessagePattern('auth.verify.user')
  verifyToken( @Payload() token: string ) {
    return this.authService.verifyToken(token)
  }
}
```

#### 09.09.04 Modificar el archivo `auth.module.ts` para que use la autenticacion con JWT

- Vamos a modificar el archivo `auth.module.ts` para que use la autenticacion con JWT.

> 02-Products-App/auth-ms/src/auth/auth.module.ts

```ts
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { envs } from 'src/config';

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  imports: [
    JwtModule.register({
      global: true,
      secret: envs.jwtSecret,
      signOptions: { expiresIn: '2h' },
    }),
  ]  
})
export class AuthModule {}
```

#### 09.09.05 Asegurarnos que al ejecutar los endpoint del documento `auth.http` se devuelve el token 

- Vamos a ejecutar los endpoint del documento `auth.http` y vamos a comprobar que se devuelve el token.

> 02-Products-App/client-gateway/src/auth/auth.http

```http
@url = http://localhost:3000/api/auth

### Crear un nuevo usuario
POST {{url}}/register
Content-Type: application/json

{
  "name": "Usuario XXX",
  "email": "usuario@gmail.com",
  "password": "1234567!02JSJSJSssswd"
}
```

- La respuesta de la petición `### Crear un nuevo usuario` es:

```json
HTTP/1.1 201 Created
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 338
ETag: W/"152-rlNe/jjtZd2Q3TbunxNATKXxg8o"
Date: Sun, 13 Apr 2025 15:21:34 GMT
Connection: close

{
  "user": {
    "id": "67fbd67e11233121f17a2c7c",
    "email": "usuario@gmail.com",
    "name": "Usuario XXX"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3ZmJkNjdlMTEyMzMxMjFmMTdhMmM3YyIsImVtYWlsIjoidXN1YXJpb0BnbWFpbC5jb20iLCJuYW1lIjoiVXN1YXJpbyBYWFgiLCJpYXQiOjE3NDQ1NTc2OTQsImV4cCI6MTc0NDU2NDg5NH0.7vx-_yeYABh1KwwFQt_CmstBfEs619HMEBJI2SKH_GU"
}
```

- Vamos a ejecutar el endpoint `### Iniciar sesión` del microservicio de `auth-ms` y vamos a comprobar que se devuelve el token.

```http
@url = http://localhost:3000/api/auth

### Iniciar sesión
POST {{url}}/login
Content-Type: application/json

{
  "email": "usuario@gmail.com",
  "password": "1234567!02JSJSJSssswd"
}
```

- La respuesta de la petición `### Iniciar sesión` es:

```json
HTTP/1.1 201 Created
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 338
ETag: W/"152-LSxoMkfM0yJX5v+dYqVwvMLDMic"
Date: Sun, 13 Apr 2025 15:25:18 GMT
Connection: close

{
  "user": {
    "id": "67fbd67e11233121f17a2c7c",
    "email": "usuario@gmail.com",
    "name": "Usuario XXX"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3ZmJkNjdlMTEyMzMxMjFmMTdhMmM3YyIsImVtYWlsIjoidXN1YXJpb0BnbWFpbC5jb20iLCJuYW1lIjoiVXN1YXJpbyBYWFgiLCJpYXQiOjE3NDQ1NTc5MTgsImV4cCI6MTc0NDU2NTExOH0.pX3Y4P2uD_tAfF5gvxZYUeKrbMnW6j_k7qZnRs8KCbY"
}
```

### 09.10 Modificar el recurso `auth` del microservicio de `client-gateway` para que use la autenticacion con JWT

#### 09.10.01 Creación de decorators para leer el token y el usuario desde el request

- Vamos a crear los decorators para leer el token y el usuario desde el request.

> 02-Products-App/client-gateway/src/auth/decorators/token.decorator.ts

```ts
import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';

export const Token = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    if (!request.token) {
      throw new InternalServerErrorException(
        'Token not found in request (AuthGuard called?)',
      );
    }

    return request.token;
  },
);
```

> 02-Products-App/client-gateway/src/auth/decorators/user.decorator.ts

```ts
import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    if (!request.user) {
      throw new InternalServerErrorException(
        'User not found in request (AuthGuard called?)',
      );
    }

    return request.user;
  },
);
```

#### 09.10.02 Creación de la interfaz `CurrentUser`

- Vamos a crear la interfaz `CurrentUser` en el archivo `src/auth/interfaces/current-user.interface.ts`.

> 02-Products-App/client-gateway/src/auth/interfaces/current-user.interface.ts

```ts
export interface CurrentUser {
  id: string;
  name: string;
  email: string;
}
```

#### 09.10.03 Creación de la Guard `AuthGuard` para proteger los endpoints

- Vamos a crear el Guard `AuthGuard` en el archivo `src/auth/guards/auth.guard.ts`.

> 02-Products-App/client-gateway/src/auth/guards/auth.guard.ts

```ts
import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

import { Request } from 'express';
import { firstValueFrom } from 'rxjs';
import { NATS_SERVICE } from 'src/config';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('Token not found');
    }
    try {
      const { user, token: newToken } = await firstValueFrom(
        this.client.send('auth.verify.user', token),
      );

      request['user'] = user;
      request['token'] = newToken;
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
```

#### 09.10.04 Modificar el archivo `auth.controller.ts` para que use la autenticacion con JWT

- Vamos a modificar el archivo `auth.controller.ts` para que use la autenticacion con JWT.

> 02-Products-App/client-gateway/src/auth/auth.controller.ts

```ts
import {
  Controller,
  Inject,
  Post,
  Body,
  Logger,
  Get,
  UseGuards,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { ClientProxy } from '@nestjs/microservices';
import { RegisterUserDto } from './dto/register-user.dto';
import { NATS_SERVICE } from 'src/config/services';
import { LoginUserDto } from './dto/login-user.dto';
import { catchError } from 'rxjs';
import { User } from './decorators/user.decorator';
import { AuthGuard } from './guards/auth.guard';
import { CurrentUser } from './interfaces/current-user.interface';
import { Token } from './decorators/token.decorator';

const debug = false;

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  @Post('register')
  registerUser(@Body() registerUserDto: RegisterUserDto) {
    if (debug) {
      this.logger.log('registerUser', registerUserDto);
    }
    return this.client.send('auth.register.user', registerUserDto).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Post('login')
  loginUser(@Body() loginUserDto: LoginUserDto) {
    if (debug) {
      this.logger.log('loginUser', loginUserDto);
    }
    return this.client.send('auth.login.user', loginUserDto).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @UseGuards( AuthGuard )
  @Get('verify')
  verifyToken( @User() user: CurrentUser, @Token() token: string  ) {
    // Validation of the token and the user is made in the AuthGuard
    return { user, token }
  }
}
```

