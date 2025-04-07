# NestJS + Microservicios: Aplicaciones escalables y modulares (parte 4)

- En este documento vamos a documentar el curso [NestJS + Microservicios: Aplicaciones escalables y modulares de Udemy](https://www.udemy.com/course/nestjs-microservicios)

## 04. Microservicios: Orders

- Vamos a crear el microservicio de Pedidos.

### 04.01. Creación del microservicio

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App$ nest new orders-ms --skip-git
✨  We will scaffold your app in a few seconds..

✔ Which package manager would you ❤️ to use? npm
CREATE orders-ms/.prettierrc (51 bytes)
CREATE orders-ms/README.md (5020 bytes)
CREATE orders-ms/eslint.config.mjs (856 bytes)
CREATE orders-ms/nest-cli.json (171 bytes)
CREATE orders-ms/package.json (2035 bytes)
CREATE orders-ms/tsconfig.build.json (97 bytes)
CREATE orders-ms/tsconfig.json (544 bytes)
CREATE orders-ms/src/app.controller.ts (274 bytes)
CREATE orders-ms/src/app.module.ts (249 bytes)
CREATE orders-ms/src/app.service.ts (142 bytes)
CREATE orders-ms/src/main.ts (228 bytes)
CREATE orders-ms/src/app.controller.spec.ts (617 bytes)
CREATE orders-ms/test/jest-e2e.json (183 bytes)
CREATE orders-ms/test/app.e2e-spec.ts (674 bytes)

✔ Installation in progress... ☕

🚀  Successfully created project orders-ms
👉  Get started with the following commands:

$ cd orders-ms
$ npm run start

                                         
                          Thanks for installing Nest 🙏
                 Please consider donating to our open collective
                        to help us maintain this package.
                                         
                                         
               🍷  Donate: https://opencollective.com/nest
```

- Como hemos usado el flag `--skip-git` no se crea el .gitignore, por lo que lo creamos nosotros.
- Lo podemos copiar del directorio 02-Products-App/products-ms/.gitignore

```bash
cp products-ms/.gitignore orders-ms/.gitignore
```

- Vamos a probar el proyecto para ver que todo está bien.

```bash
cd orders-ms
npm run start

> orders-ms@0.0.1 start
[12:38:57] Starting compilation in watch mode...

[12:38:59] Found 0 errors. Watching for file changes.

[Nest] 2015529  - 06/04/2025, 12:38:59     LOG [NestFactory] Starting Nest application...
[Nest] 2015529  - 06/04/2025, 12:38:59     LOG [InstanceLoader] AppModule dependencies initialized +8ms
[Nest] 2015529  - 06/04/2025, 12:38:59     LOG [RoutesResolver] AppController {/}: +4ms
[Nest] 2015529  - 06/04/2025, 12:38:59     LOG [RouterExplorer] Mapped {/, GET} route +3ms
[Nest] 2015529  - 06/04/2025, 12:38:59     LOG [NestApplication] Nest application successfully started +2ms
```

### 04.02. Vamos a crear la utilización de un servicio de configuración

- Vamos a crear un servicio de configuración para leer el puerto desde el archivo `.env`.
- No vamos a utilizar el `ConfigModule` de NestJS, sino que vamos a utilizar el `dotenv` para leer el archivo `.env`.
- Instalamos el paquete `dotenv`.
- Vamos a utilizar el paquete `joi` para validar el archivo `.env`.
- Vamos a instalar los paquetes de `class-transformer` y `class-validator` para que funcione correctamente las validaciones de los datos de los DTOs.
- Vamos a instalar el paquete `@nestjs/microservices` para que funcione correctamente el microservicio.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/orders-ms$
npm i dotenv joi class-transformer class-validator @nestjs/microservices

added 14 packages, and audited 801 packages in 3s

147 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

- Vamos a crear el documento `envs.ts` en el directorio `02-Products-App/orders-ms/src/config` que será el encargado de leer y validar el archivo `.env`.

> 02-Products-App/orders-ms/src/config/envs.ts

```ts
import 'dotenv/config';

import * as joi from 'joi';

interface EnvVars {
  PORT: number;
}

const envsSchema = joi
  .object({
    PORT: joi.number().required(),
  })
  .unknown(true);

const { error, value } = envsSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const envVars: EnvVars = value;

export const envs = {
  port: envVars.PORT,
};
```

- Añadir el archivo `.env` en el directorio `02-Products-App/orders-ms/src/config`

> 02-Products-App/orders-ms/.env

```text
PORT=3000
```

- Vamos a modificar el archivo `main.ts` para que utilice el servicio de configuración.

> 02-Products-App/client-gateway/src/main.ts

```ts
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { envs } from './config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
async function bootstrap() {
  const logger = new Logger('OrdersMS-Main');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        port: envs.port,
      },
    },
  );

  await app.listen();
  logger.log(`OrdersMS Microservice running on port ${envs.port}`);
}
bootstrap();
```

- Vamos a asegurarnos de que el microservicio de OrdersMS funciona y está escuchando en el puerto 3002.

```bash
[13:20:47] Starting compilation in watch mode...

[13:20:49] Found 0 errors. Watching for file changes.

[Nest] 2076942  - 06/04/2025, 13:20:49     LOG [NestFactory] Starting Nest application...
[Nest] 2076942  - 06/04/2025, 13:20:49     LOG [InstanceLoader] AppModule dependencies initialized +8ms
[Nest] 2076942  - 06/04/2025, 13:20:49     LOG [NestMicroservice] Nest microservice successfully started +11ms
[Nest] 2076942  - 06/04/2025, 13:20:49     LOG [OrdersMS-Main] OrdersMS Microservice running on port 3002
```

### 04.03. Creación de un recurso

#### 04.03.01. Creación del recurso

- Vamos a crear un recurso para el microservicio de productos.
- El "transport layer" que vamos a utilizar es el `Microservice (non-HTTP)`.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/orders-ms$ 
nest g resource orders --no-spec
✔ What transport layer do you use? Microservice (non-HTTP)
✔ Would you like to generate CRUD entry points? Yes
CREATE src/orders/orders.controller.ts (1024 bytes)
CREATE src/orders/orders.module.ts (255 bytes)
CREATE src/orders/orders.service.ts (623 bytes)
CREATE src/orders/dto/create-order.dto.ts (31 bytes)
CREATE src/orders/dto/update-order.dto.ts (188 bytes)
CREATE src/orders/entities/order.entity.ts (22 bytes)
UPDATE package.json (2226 bytes)
UPDATE src/app.module.ts (199 bytes)
✔ Packages installed successfully.
```

#### 04.03.02. Modificación del servicio

- Vamos a modificar el servicio para que utilice el para incluir `changeStatus` en el servicio y borrar los métodos `update` y `remove`.

> 02-Products-App/orders-ms/src/orders/orders.service.ts

```ts
import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
  create(createOrderDto: CreateOrderDto) {
    return 'This action adds a new order';
  }

  findAll() {
    return `This action returns all orders`;
  }

  findOne(id: number) {
    return `This action returns a #${id} order`;
  }

  changeStatus(id: number, updateOrderDto: UpdateOrderDto) {
    return `This action changes the status of a #${id} order`;
  }
}
```

#### 04.03.03. Modificación del controlador

- Vamos a modificar el controlador para que utilice el servicio de `OrdersService`.
- Tenemos que añadir el endpoint `changeOrderStatus` que se encargará de cambiar el estado de la orden.
- Tenemos que borrar los endpoints `update` y `remove`.

> 02-Products-App/orders-ms/src/orders/orders.controller.ts

```ts
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @MessagePattern('createOrder')
  create(@Payload() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @MessagePattern('findAllOrders')
  findAll() {
    return this.ordersService.findAll();
  }

  @MessagePattern('findOneOrder')
  findOne(@Payload() id: number) {
    return this.ordersService.findOne(id);
  }

  @MessagePattern('changeOrderStatus')
  changeOrderStatus(@Payload() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.changeStatus(updateOrderDto.id, updateOrderDto);
  }

}
```

#### 04.03.04. De momento no modificamos los DTOs 

- Los DTOs los dejamos tal cual están.

> 02-Products-App/orders-ms/src/orders/dto/create-order.dto.ts

```ts
export class CreateOrderDto {}
```

> 02-Products-App/orders-ms/src/orders/dto/update-order.dto.ts

```ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateOrderDto } from './create-order.dto';

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
  id: number;
}
```

#### 04.03.05. No modificamos el módulo

- Vamos a dejar el módulo tal cual está.

> 02-Products-App/orders-ms/src/orders/orders.module.ts

```ts
import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
```

#### 04.03.06. Eliminamos las entidades por que se van a manejar con Prisma.

- Vamos a eliminar el archivo `order.entity.ts` y el archivo `order.module.ts`.

#### 04.03.07. No tenemos que hacer nada en el archivo `app.module.ts` ya que ya está importando el módulo de `OrdersModule`.

> 02-Products-App/orders-ms/src/app.module.ts

```ts
import { Module } from '@nestjs/common';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [OrdersModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

#### 04.03.08. Tenemos que asegurarnos de que el microservicio de OrdersMS esté funcionando.

- Vamos a probar el microservicio de OrdersMS para asegurarnos de que está funcionando.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/orders-ms$ 
npm run start

> orders-ms@0.0.1 start
[13:44:25] Starting compilation in watch mode...

[13:44:27] Found 0 errors. Watching for file changes.

[Nest] 2110492  - 06/04/2025, 13:44:28     LOG [NestFactory] Starting Nest application...
[Nest] 2110492  - 06/04/2025, 13:44:28     LOG [InstanceLoader] AppModule dependencies initialized +9ms
[Nest] 2110492  - 06/04/2025, 13:44:28     LOG [InstanceLoader] OrdersModule dependencies initialized +1ms
[Nest] 2110492  - 06/04/2025, 13:44:28     LOG [NestMicroservice] Nest microservice successfully started +11ms
[Nest] 2110492  - 06/04/2025, 13:44:28     LOG [OrdersMS-Main] OrdersMS Microservice running on port 3002
```

### 04.04. Vamos a utilizar Docker Compose para servir PostgreSQL utilizando la imagen de PostgreSQL de Docker Hub

- Vamos a crear el archivo `docker-compose.yaml` en el directorio `02-Products-App/orders-ms`

> 02-Products-App/docker-compose.yaml

```yaml
services:
  postgres:
    image: postgres
    ports:
      - 5432:5432
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: example
      POSTGRES_DB: ordersdb
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

- Vamos a asegurarnos que la base de datos de PostgreSQL está ejecutándose.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App$ docker-compose up -d
Creating network "02-products-app_default" with the default driver
Creating volume "02-products-app_postgres_data" with default driver
Creating 02-products-app_postgres_1 ... done
Attaching to 02-products-app_postgres_1
postgres_1  | The files belonging to this database system will be owned by user "postgres".
postgres_1  | This user must also own the server process.
postgres_1  | 
postgres_1  | The database cluster will be initialized with locale "en_US.utf8".
postgres_1  | The default database encoding has accordingly been set to "UTF8".
postgres_1  | The default text search configuration will be set to "english".
postgres_1  | 
postgres_1  | Data page checksums are disabled.
postgres_1  | 
postgres_1  | fixing permissions on existing directory /var/lib/postgresql/data ... ok
postgres_1  | creating subdirectories ... ok
postgres_1  | selecting dynamic shared memory implementation ... posix
postgres_1  | selecting default "max_connections" ... 100
postgres_1  | selecting default "shared_buffers" ... 128MB
postgres_1  | selecting default time zone ... Etc/UTC
postgres_1  | creating configuration files ... ok
postgres_1  | running bootstrap script ... ok
postgres_1  | performing post-bootstrap initialization ... ok
postgres_1  | syncing data to disk ... initdb: warning: enabling "trust" authentication for local connections
postgres_1  | initdb: hint: You can change this by editing pg_hba.conf or using the option -A, or --auth-local and --auth-host, the next time you run initdb.
postgres_1  | ok
postgres_1  | 
postgres_1  | 
postgres_1  | Success. You can now start the database server using:
postgres_1  | 
postgres_1  |     pg_ctl -D /var/lib/postgresql/data -l logfile start
postgres_1  | 
postgres_1  | waiting for server to start....2025-04-06 16:44:51.167 UTC [48] LOG:  starting PostgreSQL 17.3 (Debian 17.3-1.pgdg120+1) on x86_64-pc-linux-gnu, compiled by gcc (Debian 12.2.0-14) 12.2.0, 64-bit
postgres_1  | 2025-04-06 16:44:51.168 UTC [48] LOG:  listening on Unix socket "/var/run/postgresql/.s.PGSQL.5432"
postgres_1  | 2025-04-06 16:44:51.173 UTC [51] LOG:  database system was shut down at 2025-04-06 16:44:50 UTC
postgres_1  | 2025-04-06 16:44:51.178 UTC [48] LOG:  database system is ready to accept connections
postgres_1  |  done
postgres_1  | server started
postgres_1  | 
postgres_1  | /usr/local/bin/docker-entrypoint.sh: ignoring /docker-entrypoint-initdb.d/*
postgres_1  | 
postgres_1  | waiting for server to shut down....2025-04-06 16:44:51.308 UTC [48] LOG:  received fast shutdown request
postgres_1  | 2025-04-06 16:44:51.309 UTC [48] LOG:  aborting any active transactions
postgres_1  | 2025-04-06 16:44:51.312 UTC [48] LOG:  background worker "logical replication launcher" (PID 54) exited with exit code 1
postgres_1  | 2025-04-06 16:44:51.312 UTC [49] LOG:  shutting down
postgres_1  | 2025-04-06 16:44:51.313 UTC [49] LOG:  checkpoint starting: shutdown immediate
postgres_1  | 2025-04-06 16:44:51.319 UTC [49] LOG:  checkpoint complete: wrote 3 buffers (0.0%); 0 WAL file(s) added, 0 removed, 0 recycled; write=0.002 s, sync=0.001 s, total=0.007 s; sync files=2, longest=0.001 s, average=0.001 s; distance=0 kB, estimate=0 kB; lsn=0/14E4FA0, redo lsn=0/14E4FA0
postgres_1  | 2025-04-06 16:44:51.331 UTC [48] LOG:  database system is shut down
postgres_1  |  done
postgres_1  | server stopped
postgres_1  | 
postgres_1  | PostgreSQL init process complete; ready for start up.
postgres_1  | 
postgres_1  | 2025-04-06 16:44:51.448 UTC [1] LOG:  starting PostgreSQL 17.3 (Debian 17.3-1.pgdg120+1) on x86_64-pc-linux-gnu, compiled by gcc (Debian 12.2.0-14) 12.2.0, 64-bit
postgres_1  | 2025-04-06 16:44:51.449 UTC [1] LOG:  listening on IPv4 address "0.0.0.0", port 5432
postgres_1  | 2025-04-06 16:44:51.449 UTC [1] LOG:  listening on IPv6 address "::", port 5432
postgres_1  | 2025-04-06 16:44:51.450 UTC [1] LOG:  listening on Unix socket "/var/run/postgresql/.s.PGSQL.5432"
postgres_1  | 2025-04-06 16:44:51.454 UTC [62] LOG:  database system was shut down at 2025-04-06 16:44:51 UTC
postgres_1  | 2025-04-06 16:44:51.460 UTC [1] LOG:  database system is ready to accept connections
```

- Tenemos con un cliente de PostgreSQL, como Dbeaver, podemos acceder a la base de datos de PostgreSQL.

![Acceso a PostgreSQL](nestjs-microservicios.04.001.png)

### 04.05. Vamos a configurar Prisma

#### 04.05.01. Instalación de Prisma CLI

- Vamos a instalar Prisma Package.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/orders-ms$ 
npm install prisma --save-dev

added 10 packages, and audited 813 packages in 7s

147 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

- Tenemos que instalar el paquete de Prisma Client.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/orders-ms$ 
npm install @prisma/client

added 1 package, and audited 814 packages in 7s

147 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

#### 04.05.02. Inicialización de Prisma

- Vamos a inicializar Prisma.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/orders-ms$
npx prisma init

✔ Your Prisma schema was created at prisma/schema.prisma
  You can now open it in your favorite editor.

warn You already have a .gitignore file. Don't forget to add `.env` in it to not commit any private information.

Next steps:
1. Set the DATABASE_URL in the .env file to point to your existing database. If your database has no tables yet, read https://pris.ly/d/getting-started
2. Set the provider of the datasource block in schema.prisma to match your database: postgresql, mysql, sqlite, sqlserver, mongodb or cockroachdb.
3. Run prisma db pull to turn your database schema into a Prisma schema.
4. Run prisma generate to generate the Prisma Client. You can then start querying your database.
5. Tip: Explore how you can extend the ORM with scalable connection pooling, global caching, and real-time database events. Read: https://pris.ly/cli/beyond-orm

More information in our documentation:
https://pris.ly/d/getting-started
```

- Tenemos que asegurarnos que el archivo schema.prisma se ha creado.

> 02-Products-App/orders-ms/prisma/schema.prisma

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

// Looking for ways to speed up your queries, or scale easily with your serverless or edge functions?
// Try Prisma Accelerate: https://pris.ly/cli/accelerate-init

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

- Debemos de asegurarnos de que el archivo `.env` se ha actualizado con la cadena de conexión a la base de datos.

> 02-Products-App/orders-ms/.env

```text
PORT=3002

# This was inserted by `prisma init`:
# Environment variables declared in this file are automatically made available to Prisma.
# See the documentation for more detail: https://pris.ly/d/prisma-schema#accessing-environment-variables-from-the-schema

# Prisma supports the native connection string format for PostgreSQL, MySQL, SQLite, SQL Server, MongoDB and CockroachDB.
# See the documentation for all the connection string options: https://pris.ly/d/connection-strings

DATABASE_URL="postgresql://postgres:example@localhost:5432/ordersdb"
```

#### 04.05.03. Configuración de Prisma

- Vamos a configurar `schema.prisma` para que crear los modelos de tablas en la base de datos.

> 02-Products-App/orders-ms/prisma/schema.prisma

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

// Looking for ways to speed up your queries, or scale easily with your serverless or edge functions?
// Try Prisma Accelerate: https://pris.ly/cli/accelerate-init

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum OrderStatus {
  PENDING
  DELIVERED
  CANCELLED
}

model Order {
  id          String @id @default(uuid())
  totalAmount Float
  totalItems  Int

  status OrderStatus
  paid   Boolean     @default(false)
  paidAt DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### 04.05.04. Generación de la migración

- Vamos a generar la migración para crear la tabla `Order` en la base de datos.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/orders-ms$ 
npx prisma migrate dev --name init
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "ordersdb", schema "public" at "localhost:5432"

PostgreSQL database ordersdb created at localhost:5432

Applying migration `20250406172118_init`

The following migration(s) have been created and applied from new schema changes:

migrations/
  └─ 20250406172118_init/
    └─ migration.sql

Your database is now in sync with your schema.

✔ Generated Prisma Client (v6.5.0) to ./node_modules/@prisma/client in 83ms
```

- Vamos a asegurarnos de que la tabla `Order` se ha creado en la base de datos.

![Tabla Order](nestjs-microservicios.04.002.png)

#### 04.05.05. Modificar el archivo `orders.service.ts` para utilizar Prisma

- Vamos a modificar el archivo `orders.service.ts` para utilizar Prisma.

> 02-Products-App/orders-ms/src/orders/orders.service.ts

```diff
+import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
+import { PrismaClient } from '@prisma/client';

@Injectable()
+export class OrdersService extends PrismaClient implements OnModuleInit {

+ private readonly logger = new Logger(OrdersService.name);

+ async onModuleInit() {
+   await this.$connect();
+ }

  create(createOrderDto: CreateOrderDto) {
    return 'This action adds a new order';
  }

  findAll() {
    return `This action returns all orders`;
  }

  findOne(id: number) {
    return `This action returns a #${id} order`;
  }

  changeStatus(id: number, updateOrderDto: UpdateOrderDto) {
    return `This action changes the status of a #${id} order`;
  }
}
```

#### 04.05.06. Tenemos que asegurarnos que el mensaje de "Connected to database" se muestra en la consola

```bash
[19:45:40] File change detected. Starting incremental compilation...

[19:45:40] Found 0 errors. Watching for file changes.

[Nest] 2465999  - 06/04/2025, 19:45:40     LOG [NestFactory] Starting Nest application...
[Nest] 2465999  - 06/04/2025, 19:45:40     LOG [InstanceLoader] AppModule dependencies initialized +13ms
[Nest] 2465999  - 06/04/2025, 19:45:40     LOG [InstanceLoader] OrdersModule dependencies initialized +1ms
[Nest] 2465999  - 06/04/2025, 19:45:40     LOG [OrdersService] Connected to database
[Nest] 2465999  - 06/04/2025, 19:45:40     LOG [NestMicroservice] Nest microservice successfully started +8ms
[Nest] 2465999  - 06/04/2025, 19:45:40     LOG [OrdersMS-Main] OrdersMS Microservice running on port 3002
```

#### 04.05.07. Crear los Dtos de paginación

- Vamos a crear los Dtos de paginación.

> 02-Products-App/orders-ms/src/common/dto/pagination.dto.ts

```ts
import { Type, Transform } from 'class-transformer';
import { IsOptional, IsPositive } from 'class-validator';

export class PaginationDto {
  @IsPositive()
  @IsOptional()
  @Transform(({ value }) => value ? Number(value) : 1)
  @Type(() => Number)
  page: number;

  @IsPositive()
  @IsOptional()
  @Transform(({ value }) => value ? Number(value) : 10)
  @Type(() => Number)
  limit: number;
}
```

#### 04.05.08. Crear las excepciones de RpcException

- Vamos a crear las excepciones de RpcException.

> 02-Products-App/orders-ms/src/common/exceptions/rpc-custom-exception.filter.ts

```ts
import { Catch, ArgumentsHost, ExceptionFilter } from '@nestjs/common';

import { RpcException } from '@nestjs/microservices';

@Catch(RpcException)
export class RpcCustomExceptionFilter implements ExceptionFilter {
  catch(exception: RpcException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const rpcError = exception.getError();

    if (
      typeof rpcError === 'object' &&
      'status' in rpcError &&
      'message' in rpcError
    ) {
      const status = isNaN(Number(rpcError.status)) ? 400 : Number(rpcError.status);
      return response.status(status).json(rpcError);
    }

    response.status(400).json({
      status: 400,
      message: rpcError,
    });
  }
}
```

#### 04.05.09. Crear los DTOs para el servicio de Orders

- Vamos a crear los DTOs para el servicio de Orders.

> 02-Products-App/orders-ms/src/orders/dto/create-order.dto.ts

```ts
import { OrderStatus } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
} from 'class-validator';
import { OrderStatusList } from '../enum/order.enum';

export class CreateOrderDto {
  @IsNumber()
  @IsPositive()
  totalAmount: number;

  @IsNumber()
  @IsPositive()
  totalItems: number;

  @IsEnum(OrderStatusList, {
    message: `Possible status values are ${OrderStatusList}`,
  })
  @IsOptional()
  status: OrderStatus = OrderStatus.PENDING;

  @IsBoolean()
  @IsOptional()
  paid: boolean = false;
}
```

> 02-Products-App/orders-ms/src/orders/dto/change-order-status.dto.ts

```ts
import { OrderStatus } from '@prisma/client';
import { IsEnum, IsUUID } from 'class-validator';
import { OrderStatusList } from '../enum/order.enum';

export class ChangeOrderStatusDto {
  @IsUUID(4)
  id: string;

  @IsEnum(OrderStatusList, {
    message: `Valid status are ${OrderStatusList}`,
  })
  status: OrderStatus;
}
```

> 02-Products-App/orders-ms/src/orders/dto/order-pagination.dto.ts

```ts
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from 'src/common';
import { OrderStatusList } from '../enum/order.enum';
import { OrderStatus } from '@prisma/client';

export class OrderPaginationDto extends PaginationDto {
  @IsOptional()
  @IsEnum(OrderStatusList, {
    message: `Valid status are ${OrderStatusList}`,
  })
  status: OrderStatus;
}
```

#### 04.05.10. Crear el enum de OrderStatus

- Vamos a crear el enum de OrderStatus.

> 02-Products-App/orders-ms/src/orders/enum/order.enum.ts

```ts
import { OrderStatus } from '@prisma/client';

export const OrderStatusList = [
  OrderStatus.PENDING,
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED,
]
```

#### 04.05.11. Crear el servicio de Orders

- Vamos a crear el servicio de Orders.

> 02-Products-App/orders-ms/src/orders/orders.service.ts

```ts
import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaClient } from '@prisma/client';
import { OrderPaginationDto } from './dto/order-pagination.dto';
import { RpcException } from '@nestjs/microservices';
import { ChangeOrderStatusDto } from './dto/change-order-status.dto';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(OrdersService.name);

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Connected to database');
  }

  create(createOrderDto: CreateOrderDto) {
    return this.order.create({
      data: createOrderDto,
    });
  }

  async findAll(orderPaginationDto: OrderPaginationDto) {
    const { page, limit, status } = orderPaginationDto;

    const totalPages = await this.order.count({
      where: { status },
    });
    const lastPage = Math.ceil(totalPages / limit);

    return {
      data: await this.order.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: { status },
      }),
      meta: {
        total: totalPages,
        page,
        lastPage,
      },
    };
  }

  async findOne(id: string) {
    const order = await this.order.findFirst({
      where: { id },
    });

    if (!order) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Order with id ${id} not found`,
      });
    }

    return order;
  }

  async changeStatus(changeOrderStatusDto: ChangeOrderStatusDto) {
    const { id, status } = changeOrderStatusDto;

    const order = await this.findOne(id);
    if (order.status === status) {
      return order;
    }

    return this.order.update({
      where: { id },
      data: { status },
    });
  }
}
```

#### 04.05.12. Crear el controlador de Orders

- Vamos a crear el controlador de Orders.

> 02-Products-App/orders-ms/src/orders/orders.controller.ts 

```ts
import { Controller, ParseUUIDPipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ChangeOrderStatusDto } from './dto/change-order-status.dto';
import { OrderPaginationDto } from './dto/order-pagination.dto';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @MessagePattern('createOrder')
  create(@Payload() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @MessagePattern('findAllOrders')
  findAll(@Payload() orderPaginationDto: OrderPaginationDto) {
    return this.ordersService.findAll(orderPaginationDto);
  }

  @MessagePattern('findOneOrder')
  findOne(@Payload('id', ParseUUIDPipe) id: string) {
    return this.ordersService.findOne(id);
  }

  @MessagePattern('changeOrderStatus')
  changeOrderStatus(@Payload() changeOrderStatusDto: ChangeOrderStatusDto) {
    return this.ordersService.changeStatus(changeOrderStatusDto);
  }
}
```

#### 04.05.13. Modificar el archivo `main.ts` para que utilice los validadores de NestJS

- Vamos a modificar el archivo `main.ts` para que utilice los validadores de NestJS.

> 02-Products-App/orders-ms/src/main.ts

```ts
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { envs } from './config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
async function bootstrap() {
  const logger = new Logger('OrdersMS-Main');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        port: envs.port,
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
  logger.log(`OrdersMS Microservice running on port ${envs.port}`);
}
bootstrap();
```
