# NestJS + Microservicios: Aplicaciones escalables y modulares (parte 3)

- En este documento vamos a documentar el curso [NestJS + Microservicios: Aplicaciones escalables y modulares de Udemy](https://www.udemy.com/course/nestjs-microservicios)

## 03. Microservicios: Gateway

- Vamos a crear el microservicio de ClientGateway.

### 03.01. Creación del microservicio

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App$
nest new client-gateway --skip-git
✨  We will scaffold your app in a few seconds..

✔ Which package manager would you ❤️ to use? npm
CREATE client-gateway/.prettierrc (51 bytes)
CREATE client-gateway/README.md (5020 bytes)
CREATE client-gateway/eslint.config.mjs (856 bytes)
CREATE client-gateway/nest-cli.json (171 bytes)
CREATE client-gateway/package.json (2040 bytes)
CREATE client-gateway/tsconfig.build.json (97 bytes)
CREATE client-gateway/tsconfig.json (544 bytes)
CREATE client-gateway/src/app.controller.ts (274 bytes)
CREATE client-gateway/src/app.module.ts (249 bytes)
CREATE client-gateway/src/app.service.ts (142 bytes)
CREATE client-gateway/src/main.ts (228 bytes)
CREATE client-gateway/src/app.controller.spec.ts (617 bytes)
CREATE client-gateway/test/jest-e2e.json (183 bytes)
CREATE client-gateway/test/app.e2e-spec.ts (674 bytes)

✔ Installation in progress... ☕

🚀  Successfully created project client-gateway
👉  Get started with the following commands:

$ cd client-gateway
$ npm run start

                                         
                          Thanks for installing Nest 🙏
                 Please consider donating to our open collective
                        to help us maintain this package.
                                         
                                         
               🍷  Donate: https://opencollective.com/nest
```

- Como hemos usado el flag `--skip-git` no se crea el .gitignore, por lo que lo creamos nosotros.
- Lo podemos copiar del directorio 02-Products-App/products-ms/.gitignore

```bash
cp products-ms/.gitignore client-gateway/.gitignore
```

- Vamos a probar el proyecto para ver que todo está bien.

```bash
cd client-gateway
npm run start

> client-gateway@0.0.1 start
> nest start

[Nest] 844982  - 03/04/2025, 18:07:17     LOG [NestFactory] Starting Nest application...
[Nest] 844982  - 03/04/2025, 18:07:17     LOG [InstanceLoader] AppModule dependencies initialized +7ms
[Nest] 844982  - 03/04/2025, 18:07:17     LOG [RoutesResolver] AppController {/}: +4ms
[Nest] 844982  - 03/04/2025, 18:07:17     LOG [RouterExplorer] Mapped {/, GET} route +3ms
[Nest] 844982  - 03/04/2025, 18:07:17     LOG [NestApplication] Nest application successfully started +1ms
```

### 03.02. Vamos a crear la utilización de un servicio de configuración

- Vamos a crear un servicio de configuración para leer el puerto desde el archivo `.env`.
- No vamos a utilizar el `ConfigModule` de NestJS, sino que vamos a utilizar el `dotenv` para leer el archivo `.env`.
- Instalamos el paquete `dotenv`.
- Vamos a utilizar el paquete `joi` para validar el archivo `.env`.
- Vamos a instalar los paquetes de `class-transformer` y `class-validator` para que funcione correctamente las validaciones de los datos de los DTOs.

```bash
npm i dotenv joi class-transformer class-validator

added 14 packages, and audited 1619 packages in 3s

148 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

- Vamos a crear el document `envs.ts` en el directorio `03-Client-Gateway/client-gateway/src/config` que será el encargado de leer y validar el archivo `.env`.

> 02-Products-App/client-gateway/src/config/envs.ts

```ts
import 'dotenv/config';

import * as joi from 'joi';

interface EnvVars {
  PORT: number;
  PRODUCTS_MICROSERVICE_HOST: string;
  PRODUCTS_MICROSERVICE_PORT: number;
}

const envsSchema = joi
  .object({
    PORT: joi.number().required(),
    PRODUCTS_MICROSERVICE_HOST: joi.string().required(),
    PRODUCTS_MICROSERVICE_PORT: joi.number().required(),
  })
  .unknown(true);

const { error, value } = envsSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const envVars: EnvVars = value;

export const envs = {
  port: envVars.PORT,
  productsMicroserviceHost: envVars.PRODUCTS_MICROSERVICE_HOST,
  productsMicroservicePort: envVars.PRODUCTS_MICROSERVICE_PORT,
};
```

- Añadir el archivo `.env` en el directorio `03-Client-Gateway/client-gateway/src/config`

> 02-Products-App/client-gateway/.env

```text
PORT=3000

PRODUCTS_MICROSERVICE_HOST=localhost
PRODUCTS_MICROSERVICE_PORT=3001
```

- Vamos a modificar el archivo `main.ts` para que utilice el servicio de configuración.

> 02-Products-App/client-gateway/src/main.ts

```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { envs } from './config';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Main-Gateway');

  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(envs.port);

  logger.log(`Gateway running on port ${envs.port}`);
}
bootstrap();

```

- Vamos a asegurarnos de que el microservicio de ClientGateway funciona y está escuchando en el puerto 3000.

```bash
[18:27:45] Starting compilation in watch mode...

[18:27:47] Found 0 errors. Watching for file changes.

[Nest] 883464  - 03/04/2025, 18:27:47     LOG [NestFactory] Starting Nest application...
[Nest] 883464  - 03/04/2025, 18:27:47     LOG [InstanceLoader] AppModule dependencies initialized +7ms
[Nest] 883464  - 03/04/2025, 18:27:47     LOG [NestApplication] Nest application successfully started +127ms
[Nest] 883464  - 03/04/2025, 18:27:47     LOG [Main-Gateway] Gateway running on port 3000
```

### 03.03. Vamos a crear un resource para que el microservicio de ClientGateway pueda comunicarse con el microservicio de Products

#### 03.03.01. Creación del resource

- Vamos a crear un resource para que el microservicio de ClientGateway pueda comunicarse con el microservicio de Products.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/client-gateway$ nest g resource products --no-spec
✔ What transport layer do you use? REST API
✔ Would you like to generate CRUD entry points? No
CREATE src/products/products.controller.ts (228 bytes)
CREATE src/products/products.module.ts (269 bytes)
CREATE src/products/products.service.ts (92 bytes)
UPDATE package.json (2190 bytes)
UPDATE src/app.module.ts (207 bytes)
✔ Packages installed successfully.
```

#### 03.03.02. Vamos a crear los mismos DTOs que ya teníamos en el microservicio de Products para el microservicio de ClientGateway

- Vamos a crear los DTOs en el directorio `03-Client-Gateway/client-gateway/src/products/dto`.

> 02-Products-App/client-gateway/src/products/dto/create-product.dto.ts

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
  @Type(() => Number )
  public price: number;

}
```

> 02-Products-App/client-gateway/src/products/dto/update-product.dto.ts

```ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {}
```

> 02-Products-App/client-gateway/src/common/dto/pagination.dto.ts

```ts
import { Type } from 'class-transformer';
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

#### 03.03.03. Vamos a crear el controlador para el microservicio de ClientGateway

- Vamos a crear el controlador para el microservicio de products de ClientGateway.

> 02-Products-App/client-gateway/src/products/products.controller.ts

```ts
import { Controller, Body, Logger, Get, Post, Query, Param, Delete, Patch, ParseIntPipe } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
export class ProductsController {

  private readonly logger = new Logger(ProductsController.name);

  constructor() {}
  
  @Post()
  createProduct(@Body() createProductDto: CreateProductDto) {
    this.logger.log('createProduct', JSON.stringify(createProductDto, null, 2));
    return 'Producto creado';
  }

  @Get()
  findAllProducts(@Query() paginationDto: PaginationDto) {
    this.logger.log('findAllProducts', JSON.stringify(paginationDto, null, 2));
    return 'Productos encontrados';
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    this.logger.log('findOne', id);

    return 'Producto encontrado';
  }

  @Delete(':id')
  deleteProduct(@Param('id') id: string) {
    this.logger.log('deleteProduct', id);
    return 'Producto eliminado';
  }

  @Patch(':id')
  patchProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    this.logger.log('patchProduct', id, JSON.stringify(updateProductDto, null, 2));
    return 'Producto actualizado';
  }
}
```

#### 03.03.04. Vamos a crear el documento `products.http` para probar products desde el microservicio de ClientGateway

> 02-Products-App/client-gateway/src/products/products.http

```http
@url = http://localhost:3000/api/products

### Crear un nuevo producto
POST {{url}}
Content-Type: application/json

{
  "name": "Producto XXX",
  "price": 13.45
}

### Obtener todos los productos
GET {{url}}?page=1&limit=10


### Obtener un producto por ID
GET {{url}}/2

### Actualizar un producto por ID
PATCH {{url}}/2
Content-Type: application/json

{
  "name": "Producto 1 actualizado",
  "price": 300
}

### Eliminar un producto por ID
DELETE {{url}}/2
```

- Vamos a probar el microservicio de ClientGateway desde el documento `products.http`.

### 03.04 Conectar el microservicio de ClientGateway con el microservicio de Products

#### 03.04.01. Instalación de @nestjs/microservices

- Vamos a instalar el paquete `@nestjs/microservices` para que el microservicio de ClientGateway pueda comunicarse con el microservicio de Products.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/client-gateway$ npm i @nestjs/microservices

added 1 package, and audited 814 packages in 3s

149 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

#### 03.04.02. Vamos a modificar el módulo de Products en el microservicio de ClientGateway

- Vamos a modificar el módulo de Products en el microservicio de ClientGateway para que pueda comunicarse con el microservicio de Products.

> 02-Products-App/client-gateway/src/products/products.module.ts

```ts
import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PRODUCT_SERVICE, envs } from 'src/config';

@Module({
  controllers: [ProductsController],
  providers: [],
  imports: [
    ClientsModule.register([
      {
        name: PRODUCT_SERVICE,
        transport: Transport.TCP,
        options: {
          host: envs.productsMicroserviceHost,
          port: envs.productsMicroservicePort,
        },
      },
    ]),
  ],
})
export class ProductsModule {}
```

#### 03.04.03. Vamos a modificar el controlador de Products en el microservicio de ClientGateway

- Vamos a modificar el controlador de Products en el microservicio de ClientGateway para que pueda comunicarse con el microservicio de Products.

> 02-Products-App/client-gateway/src/products/products.controller.ts

```ts
import {
  Controller,
  Body,
  Logger,
  Get,
  Post,
  Query,
  Param,
  Delete,
  Patch,
  ParseIntPipe,
  Inject,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { PRODUCT_SERVICE } from 'src/config';
import { catchError, firstValueFrom } from 'rxjs';

@Controller('products')
export class ProductsController {
  private readonly logger = new Logger(ProductsController.name);

  constructor(
    @Inject(PRODUCT_SERVICE) private readonly productsClient: ClientProxy,
  ) {}

  @Post()
  createProduct(@Body() createProductDto: CreateProductDto) {
    return this.productsClient.send(
      { cmd: 'create-product' },
      createProductDto,
    );
  }

  @Get()
  findAllProducts(@Query() paginationDto: PaginationDto) {
    return this.productsClient.send(
      { cmd: 'find-all-products' },
      paginationDto,
    );
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    try {
      return await firstValueFrom(
        this.productsClient.send({ cmd: 'find-one-product' }, { id })
      );
    } catch (error) {
      throw new RpcException(error);
    }
  }

  @Delete(':id')
  async deleteProduct(@Param('id', ParseIntPipe) id: number) {
    try {
      return await firstValueFrom(
        this.productsClient.send({ cmd: 'remove-product' }, { id })
      );
    } catch (error) {
      throw new RpcException(error);
    }
  }

  @Patch(':id')
  patchProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsClient
      .send(
        { cmd: 'update-product' },
        {
          id,
          ...updateProductDto,
        },
      )
      .pipe(
        catchError((err) => {
          throw new RpcException(err);
        }),
      );
  }
}
```

- Podemos probar el microservicio de ClientGateway desde el documento `products.http` y ver que todo funciona correctamente.

#### 03.05 Creación de un `Custom Exception` Filter para el microservicio de ClientGateway

##### 03.05.01. Creación del `Custom Exception` Filter

- Vamos a crear el `Custom Exception` Filter para el microservicio de ClientGateway para gestionar los errores que se produzcan en los microservicios de que se llaman desde ClientGateway.

> 02-Products-App/client-gateway/src/common/exceptions/rpc-custom-exception.filter.ts

```ts
import { Catch, ArgumentsHost, ExceptionFilter, HttpStatus } from '@nestjs/common';

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
      const status = isNaN(Number(rpcError.status)) ? HttpStatus.BAD_REQUEST : Number(rpcError.status);
      return response.status(status).json(rpcError);
    }

    response.status(HttpStatus.BAD_REQUEST).json({
      status: HttpStatus.BAD_REQUEST,
      message: rpcError,
    });
  }
}
```

##### 03.05.02. Añadir el `Custom Exception` Filter al documento `main.ts` del microservicio de ClientGateway

- Vamos a añadir el `Custom Exception` Filter al documento `main.ts` del microservicio de ClientGateway.

> 02-Products-App/client-gateway/src/main.ts

```diff
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { envs } from './config';
import { Logger, ValidationPipe } from '@nestjs/common';
+import { RpcCustomExceptionFilter } from './common';

async function bootstrap() {
  const logger = new Logger('Main-Gateway');

  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

+ app.useGlobalFilters(new RpcCustomExceptionFilter())

  await app.listen(envs.port);

  logger.log(`Gateway running on port ${envs.port}`);
}
bootstrap();
```

- Podemos probar el microservicio de ClientGateway desde el documento `products.http` y ver que todo funciona correctamente.


















