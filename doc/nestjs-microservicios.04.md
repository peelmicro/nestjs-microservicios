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
