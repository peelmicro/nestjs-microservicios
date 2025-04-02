# NestJS + Microservicios: Aplicaciones escalables y modulares (parte 2)

- En este documento vamos a documentar el curso [NestJS + Microservicios: Aplicaciones escalables y modulares de Udemy](https://www.udemy.com/course/nestjs-microservicios)

## 02. Microservicios: Productos

- Vamos a crear el microservicio de productos.

### 02.01. Creación del microservicio

```bash
nest new products-ms --skip-git
✨  We will scaffold your app in a few seconds..

✔ Which package manager would you ❤️ to use? npm
CREATE products-ms/.prettierrc (51 bytes)
CREATE products-ms/README.md (5020 bytes)
CREATE products-ms/eslint.config.mjs (856 bytes)
CREATE products-ms/nest-cli.json (171 bytes)
CREATE products-ms/package.json (2037 bytes)
CREATE products-ms/tsconfig.build.json (97 bytes)
CREATE products-ms/tsconfig.json (544 bytes)
CREATE products-ms/src/app.controller.ts (274 bytes)
CREATE products-ms/src/app.module.ts (249 bytes)
CREATE products-ms/src/app.service.ts (142 bytes)
CREATE products-ms/src/main.ts (228 bytes)
CREATE products-ms/src/app.controller.spec.ts (617 bytes)
CREATE products-ms/test/jest-e2e.json (183 bytes)
CREATE products-ms/test/app.e2e-spec.ts (674 bytes)

✔ Installation in progress... ☕

🚀  Successfully created project products-ms
👉  Get started with the following commands:

 cd products-ms
$ npm run start

                                         
                          Thanks for installing Nest 🙏
                 Please consider donating to our open collective
                        to help us maintain this package.
                                                                                  
               🍷  Donate: https://opencollective.com/nest
```

- Como hemos usado el flag `--skip-git` no se crea el .gitignore, por lo que lo creamos nosotros.
- Lo podemos copiar del directorio 01-Reforzamiento/products/.gitignore

```bash
cp 01-Reforzamiento/products/.gitignore products-ms/.gitignore
```

- Vamos a probar el proyecto para ver que todo está bien.

```bash
cd 02-Products-App/products-ms/
npm run start
[17:51:07] Starting compilation in watch mode...

[17:51:09] Found 0 errors. Watching for file changes.

[Nest] 804333  - 02/04/2025, 17:51:10     LOG [NestFactory] Starting Nest application...
[Nest] 804333  - 02/04/2025, 17:51:10     LOG [InstanceLoader] AppModule dependencies initialized +7ms
[Nest] 804333  - 02/04/2025, 17:51:10     LOG [RoutesResolver] AppController {/}: +4ms
[Nest] 804333  - 02/04/2025, 17:51:10     LOG [RouterExplorer] Mapped {/, GET} route +2ms
[Nest] 804333  - 02/04/2025, 17:51:10     LOG [NestApplication] Nest application successfully started +2ms
```

### 02.02. Creación de un recurso

- Vamos a crear un recurso para el microservicio de productos.

```bash
nest g resource products --no-spec
✔ What transport layer do you use? REST API
✔ Would you like to generate CRUD entry points? Yes
CREATE src/products/products.controller.ts (957 bytes)
CREATE src/products/products.module.ts (269 bytes)
CREATE src/products/products.service.ts (651 bytes)
CREATE src/products/dto/create-product.dto.ts (33 bytes)
CREATE src/products/dto/update-product.dto.ts (181 bytes)
CREATE src/products/entities/product.entity.ts (24 bytes)
UPDATE package.json (2070 bytes)
UPDATE src/app.module.ts (207 bytes)
✔ Packages installed successfully.
```

### 02.03. Vamos a completar los DTOs y la entidad

- Necesitamos instalar los paquetes `class-transformer` y `class-validator`.

```bash
npm i class-transformer class
-validator

added 5 packages, and audited 810 packages in 3s

147 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

- Vamos a completar los DTOs y la entidad.

> 02-Products-App/products-ms/src/products/dto/create-product.dto.ts

```ts
import { Type } from 'class-transformer';
import { IsNumber, IsString, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  public name: string;

  @IsNumber({
    maxDecimalPlaces: 4,
  })
  @Min(0)
  @Type(() => Number)
  public price: number;
}
```

> 02-Products-App/products-ms/src/products/dto/update-product.dto.ts

```ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';
import { IsNumber, IsPositive } from 'class-validator';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @IsNumber()
  @IsPositive()
  id: number;
}
```

> 02-Products-App/products-ms/src/products/entities/product.entity.ts 

```ts
export class Product {
  public id: number;

  public name: string;

  public price: number;
}
```

- necesitamos cambiar el document `main.ts` para habilitar las validaciones de DTOs.

> 02-Products-App/products-ms/src/main.ts

```diff
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
+import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

+ app.useGlobalPipes(
+   new ValidationPipe({
+     whitelist: true,
+     forbidNonWhitelisted: true,
+   }),
+ );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

### 02.04. Vamos a crear la utilización de un servicio de configuración

- Vamos a crear un servicio de configuración para leer el puerto desde el archivo `.env`.
- No vamos a utilizar el `ConfigModule` de NestJS, sino que vamos a utilizar el `dotenv` para leer el archivo `.env`.
- Instalamos el paquete `dotenv`.

```bash
npm i dotenv

up to date, audited 811 packages in 2s

148 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

- Vamos a utilizar el paquete `joi` para validar el archivo `.env`.

```bash
npm i joi

added 6 packages, and audited 817 packages in 2s

148 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

- Vamos a crear el document `envs.ts` en el directorio `02-Products-App/products-ms/src/config` que será el encargado de leer y validar el archivo `.env`.

> 02-Products-App/products-ms/src/config/envs.ts

```ts
import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
  PORT: number;
  DATABASE_URL: string;
}

const envsSchema = joi
  .object({
    PORT: joi.number().required(),
    DATABASE_URL: joi.string().required(),
  })
  .unknown(true);

const { error, value } = envsSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const envVars: EnvVars = value;

export const envs = {
  port: envVars.PORT,
  databaseUrl: envVars.DATABASE_URL,
};
```

- Añadir el archivo `.env` en el directorio `02-Products-App/products-ms/src/config`

> 02-Products-App/products-ms/.env

```text
PORT=3000
```

- Vamos a modificar el archivo `main.ts` para que utilice el servicio de configuración.

> 02-Products-App/products-ms/src/main.ts

```diff
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
+import { envs } from './config/envs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
- await app.listen(process.env.PORT ?? 3000);  
+ await app.listen(envs.port);
+ console.log(`Server running on port ${envs.port}`);
}
bootstrap();
```

### 02.05 Utilización de Prisma

- Vamos a utilizar Prisma como nuestro sistema ORM para interactuar con la base de datos.

```bash
npm i prisma --save-dev

added 10 packages, and audited 827 packages in 7s

148 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

- Vamos a el archivo inicial de Prisma utilizando el comando `npx prisma init`.

```bash
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

- Vemos que le añade la variable `DATABASE_URL` en el archivo `.env`.
- Como por defecto utiliza PostgreSQL, tenemos que cambiarlo por SQLite.

> 02-Products-App/products-ms/.env

```text
PORT=3001

# This was inserted by `prisma init`:
# Environment variables declared in this file are automatically made available to Prisma.
# See the documentation for more detail: https://pris.ly/d/prisma-schema#accessing-environment-variables-from-the-schema

# Prisma supports the native connection string format for PostgreSQL, MySQL, SQLite, SQL Server, MongoDB and CockroachDB.
# See the documentation for all the connection string options: https://pris.ly/d/connection-strings

DATABASE_URL="postgresql://johndoe:randompassword@localhost:5432/mydb?schema=public"
```

- Vamos a cambiar el valor de `DATABASE_URL` por el de SQLite.

> 02-Products-App/products-ms/prisma/schema.prisma

```text
PORT=3001

# This was inserted by `prisma init`:
# Environment variables declared in this file are automatically made available to Prisma.
# See the documentation for more detail: https://pris.ly/d/prisma-schema#accessing-environment-variables-from-the-schema

# Prisma supports the native connection string format for PostgreSQL, MySQL, SQLite, SQL Server, MongoDB and CockroachDB.
# See the documentation for all the connection string options: https://pris.ly/d/connection-strings

DATABASE_URL="file:./dev.db"
```

- También ha creado el archivo `prisma/schema.prisma` que es el encargado de definir la estructura de la base de datos.

> 02-Products-App/products-ms/prisma/schema.prisma

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

- Vamos a cambiar el provider por SQLite.
- Vamos a añadir el modelo `Product` que será el encargado de definir la estructura de la tabla `products` en la base de datos.

> 02-Products-App/products-ms/prisma/schema.prisma

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

// Looking for ways to speed up your queries, or scale easily with your serverless or edge functions?
// Try Prisma Accelerate: https://pris.ly/cli/accelerate-init

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Product {
  id    Int    @id @default(autoincrement())
  name  String
  price Float

  available Boolean @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([available])
}
```

- Tenemos que ejecutar la migración para crear la tabla `products` en la base de datos utilizando el comando `npx prisma migrate dev --name init`.

```bash
npx prisma migrate dev --name init
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": SQLite database "dev.db" at "file:./dev.db"

SQLite database dev.db created at file:./dev.db

Applying migration `20250402170611_init`

The following migration(s) have been created and applied from new schema changes:

migrations/
  └─ 20250402170611_init/
    └─ migration.sql

Your database is now in sync with your schema.

Running generate... (Use --skip-generate to skip the generators)

✔ Generated Prisma Client (v6.5.0) to ./node_modules/@prisma/client in 59ms
```

- Vemos que se ha creado el archivo `migrations/20250402170611_init/migration.sql` que es el encargado de crear la tabla `products` en la base de datos.
- También se ha creado el archivo `dev.db` que es la base de datos SQLite.

![Creación del cliente de Prisma](nestjs-microservicios.02.001.png)

- Vamos a instalar el cliente de Prisma.

```bash
npm i @prisma/client

up to date, audited 828 packages in 2s

148 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

- Vamos a generar actualizar el `ProductService` para que utilice el cliente de Prisma.

> 02-Products-App/products-ms/src/products/products.service.ts

```ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {

  private readonly logger = new Logger(ProductsService.name);
  async onModuleInit() {
    await this.$connect();
    this.logger.log('Connected to the database');
  }

  create(createProductDto: CreateProductDto) {
    return 'This action adds a new product';
  }

  findAll() {
    return `This action returns all products`;
  }

  findOne(id: number) {
    return `This action returns a #${id} product`;
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
  }

  remove(id: number) {
    return `This action removes a #${id} product`;
  }
}
```

- Si ejecutamos el proyecto, veremos que se muestra el mensaje de conexión a la base de datos.

```bash
[19:15:20] Starting compilation in watch mode...

[19:15:22] Found 0 errors. Watching for file changes.

[Nest] 976921  - 02/04/2025, 19:15:23     LOG [NestFactory] Starting Nest application...
[Nest] 976921  - 02/04/2025, 19:15:23     LOG [InstanceLoader] AppModule dependencies initialized +10ms
[Nest] 976921  - 02/04/2025, 19:15:23     LOG [InstanceLoader] ProductsModule dependencies initialized +0ms
[Nest] 976921  - 02/04/2025, 19:15:23     LOG [RoutesResolver] ProductsController {/products}: +4ms
[Nest] 976921  - 02/04/2025, 19:15:23     LOG [RouterExplorer] Mapped {/products, POST} route +2ms
[Nest] 976921  - 02/04/2025, 19:15:23     LOG [RouterExplorer] Mapped {/products, GET} route +1ms
[Nest] 976921  - 02/04/2025, 19:15:23     LOG [RouterExplorer] Mapped {/products/:id, GET} route +0ms
[Nest] 976921  - 02/04/2025, 19:15:23     LOG [RouterExplorer] Mapped {/products/:id, PATCH} route +1ms
[Nest] 976921  - 02/04/2025, 19:15:23     LOG [RouterExplorer] Mapped {/products/:id, DELETE} route +0ms
[Nest] 976921  - 02/04/2025, 19:15:23     LOG [ProductsService] Connected to the database
[Nest] 976921  - 02/04/2025, 19:15:23     LOG [NestApplication] Nest application successfully started +1ms
Server running on port 3001
```

- Vamos a crear el controlador `ProductsController` que será el encargado de manejar las peticiones HTTP.

> 02-Products-App/products-ms/src/products/products.controller.ts




