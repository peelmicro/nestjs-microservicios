# NestJS + Microservicios: Aplicaciones escalables y modulares (parte 8)

- En este documento vamos a documentar el curso [NestJS + Microservicios: Aplicaciones escalables y modulares de Udemy](https://www.udemy.com/course/nestjs-microservicios)

## 08 Integración del payments-ms con el orders-ms

### 08.01 Introducción

- Vamos a integrar el microservicio de pagos con el microservicio de pedidos.

### 08.02 Modificar el archivo `docker-compose.yml` para incluir el microservicio de pagos payments-ms

- Vamos a modificar el archivo `docker-compose.yml` en el directorio `02-Products-App/orders-ms` para incluir el microservicio de pagos.

> 02-Products-App/docker-compose.yaml

```yaml
services:
  postgres:
    container_name: postgres
    image: postgres
    ports:
      - 5432:5432
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: example
      POSTGRES_DB: ordersdb
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  nats-server:
    container_name: nats-server
    image: nats:latest
    ports:
      - "8222:8222"
      - "4222:4222"

  client-gateway:
    container_name: client-gateway
    build: ./client-gateway
    ports:
      - "${CLIENT_GATEWAY_PORT}:3000"
    volumes:
      - ./client-gateway/src:/usr/src/app/src
    command: npm run start:dev
    environment:
      - PORT=3000
      - NATS_SERVERS=nats://nats-server:4222

  products-ms:
    container_name: products-ms
    build: ./products-ms
    volumes:
      - ./products-ms/src:/usr/src/app/src
    command: npm run docker:start
    environment:
      - PORT=3001
      - NATS_SERVERS=nats://nats-server:4222
      - DATABASE_URL=file:./dev.db

  orders-ms:
    container_name: orders-ms
    depends_on:
      postgres:
        condition: service_healthy
    build: ./orders-ms
    volumes:
      - ./orders-ms/src:/usr/src/app/src
    command: npm run docker:start
    environment:
      - PORT=3002
      - DATABASE_URL=postgresql://postgres:example@postgres:5432/ordersdb
      - NATS_SERVERS=nats://nats-server:4222

  payments-ms:
    container_name: payments-ms
    build: ./payments-ms
    volumes:
      - ./payments-ms/src:/usr/src/app/src
    command: npm run start:dev
    ports:
      - ${PAYMENTS_MS_PORT}:${PAYMENTS_MS_PORT}
    environment:
      - PORT=${PAYMENTS_MS_PORT}
      - NATS_SERVERS=nats://nats-server:4222
      - STRIPE_SECRET=${STRIPE_SECRET}
      - STRIPE_SUCCESS_URL=${STRIPE_SUCCESS_URL}
      - STRIPE_CANCEL_URL=${STRIPE_CANCEL_URL}
      - STRIPE_ENDPOINT_SECRET=${STRIPE_ENDPOINT_SECRET}      

volumes:
  postgres_data:
```

- Necesitamos actualizar el archivo `.env` en el directorio `02-Products-App/payments-ms` para incluir las variables de entorno.

> 02-Products-App/payments-ms/.env

```text
CLIENT_GATEWAY_PORT=3000

PAYMENTS_MS_PORT=3003

# https://dashboard.stripe.com/test/apikeys
STRIPE_SECRET=sk_test_
STRIPE_SUCCESS_URL=http://localhost:3003/payments/success
STRIPE_CANCEL_URL=http://localhost:3003/payments/cancel

# https://dashboard.stripe.com/test/webhooks/we_1OrjjpLpSSVtW50ltIQEAP8z
# Este es el signing secret del webhook
STRIPE_ENDPOINT_SECRET=whsec_
```

### 08.03 Copiar y actualizar los archivos `Dockerfile` y `.dockerignore` del microservicio de pagos orders-ms en el directorio `02-Products-App/payments-ms`

- Vamos a copiar el archivo `Dockerfile` y `.dockerignore` del microservicio de pagos orders-ms en el directorio `02-Products-App/payments-ms` y luego actualizar el archivo `Dockerfile` para que el puerto sea el 3003.

> 02-Products-App/payments-ms/Dockerfile

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

- Tenemos que asegurarnos de que el puerto 3003 esté disponible y que podemos hacer una petición a la ruta `/payments/create-payment-session` para crear una sesión de pago.

### 08.04 Modificar el `payments-ms` microservicio para que se pueda conectar con el `orders-ms` microservicio utilizando `NATS`, es decir, hacer un microservicio `híbrido`, con acceso tanto desde NTAS como desde HTTP

#### 08.04.01 Modificar el archivo `.env` del microservicio de pagos para añadir la variable de entorno `NATS_SERVERS`

> 02-Products-App/payments-ms/.env

```text
.
NATS_SERVERS=nats://nats-server:4222
```

#### 08.04.02 Modificar el archivo `envs.ts` para incluir la variable de entorno `NATS_SERVERS`

> 02-Products-App/payments-ms/src/config/envs.ts

```typescript
import 'dotenv/config';

import * as joi from 'joi';

interface EnvVars {
  PORT: number;

  STRIPE_SECRET: string;
  STRIPE_SUCCESS_URL: string;
  STRIPE_CANCEL_URL: string;
  STRIPE_ENDPOINT_SECRET: string;
  NATS_SERVERS: string;
}

const envsSchema = joi.object({
  PORT: joi.number().required(),

  STRIPE_SECRET: joi.string().required(),
  STRIPE_SUCCESS_URL: joi.string().required(),
  STRIPE_CANCEL_URL: joi.string().required(),
  STRIPE_ENDPOINT_SECRET: joi.string().required(),
  NATS_SERVERS: joi.string().required(),
})
.unknown(true);

const { error, value } = envsSchema.validate( process.env );


if ( error ) {
  throw new Error(`Config validation error: ${ error.message }`);
}

const envVars:EnvVars = value;


export const envs = {
  port: envVars.PORT,
  stripeSecret: envVars.STRIPE_SECRET,
  stripeSuccessUrl: envVars.STRIPE_SUCCESS_URL,
  stripeCancelUrl: envVars.STRIPE_CANCEL_URL,
  stripeEndpointSecret: envVars.STRIPE_ENDPOINT_SECRET,
  natsServers: envVars.NATS_SERVERS,
}
```

#### 08.04.03 Modificar el archivo `main.ts` del microservicio de pagos para que se pueda conectar con el microservicio de pedidos utilizando `NATS`

> Note: Como se explica en [Sharing Configuration](https://docs.nestjs.com/faq/hybrid-application#sharing-configuration), By default a hybrid application will not inherit global pipes, interceptors, guards and filters configured for the main (HTTP-based) application. To inherit these configuration properties from the main application, set the inheritAppConfig property in the second argument (an optional options object) of the connectMicroservice() call, as follow:

> 02-Products-App/payments-ms/src/main.ts

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { envs } from './config/envs';
import { MicroserviceOptions } from '@nestjs/microservices';
import { Transport } from '@nestjs/microservices';

async function bootstrap() {
  const logger = new Logger('Payments-ms');

  const app = await NestFactory.create(AppModule, {
    rawBody: true
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.NATS,
    options: {
      servers: envs.natsServers,
    },
  }, {
    inheritAppConfig: true
  })


  await app.startAllMicroservices();  

  await app.listen(envs.port);

  logger.log(`Payments Microservice running on port ${envs.port}`);
}
bootstrap();
```

#### 08.04.04 Modificar el archivo `docker-compose.yaml` del microservicio de pagos para que se pueda conectar con el microservicio de pedidos utilizando `NATS`

> 02-Products-App/payments-ms/docker-compose.yaml

```diff
.
  payments-ms:
    container_name: payments-ms
    build: ./payments-ms
    volumes:
      - ./payments-ms/src:/usr/src/app/src
    command: npm run start:dev
    ports:
      - ${PAYMENTS_MS_PORT}:${PAYMENTS_MS_PORT}
    environment:
      - PORT=${PAYMENTS_MS_PORT}
      - STRIPE_SECRET=${STRIPE_SECRET}
      - STRIPE_SUCCESS_URL=${STRIPE_SUCCESS_URL}
      - STRIPE_CANCEL_URL=${STRIPE_CANCEL_URL}
      - STRIPE_ENDPOINT_SECRET=${STRIPE_ENDPOINT_SECRET}      
+     - NATS_SERVERS=${NATS_SERVERS}
```

#### 08.04.05 Modificar el archivo `payments.controller.ts` del microservicio de pagos para que se pueda conectar desde otro microservicio utilizando `NATS`

> 02-Products-App/payments-ms/src/controllers/payments.controller.ts

```diff
import { Controller, Get, Post, Req, Res, Body, Logger } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentSessionDto } from './dto/payment-session.dto';
import { Request, Response } from 'express'
+import { MessagePattern } from '@nestjs/microservices';

@Controller('payments')
export class PaymentsController {

  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-payment-session')
+ @MessagePattern('create.payment.session')
  createPaymentSession(@Body() paymentSessionDto: PaymentSessionDto ) {
    return this.paymentsService.createPaymentSession(paymentSessionDto);
  }

  @Get('success')
  success() {
    return {
      ok: true,
      message: 'Payment successful'
    }
  }

  @Get('cancel')
  cancel() {
    return {
      ok: false,
      message: 'Payment cancelled'
    }
  }


  @Post('/webhook')
  async stripeWebhook(@Req() req: Request, @Res() res: Response) {
    // this.logger.log(`Webhook received`, JSON.stringify(req.body, null, 2));
    return this.paymentsService.stripeWebhook(req, res);
  }  
}
```

### 08.05 Modificar el servicio `orders-ms` para que se pueda conectar con el microservicio de pagos utilizando `NATS`

#### 08.05.01 Creación de un interfaz para el microservicio de pagos

> 02-Products-App/orders-ms/src/orders/interfaces/order-with-produts.interface.ts

```typescript
import { OrderStatus } from '@prisma/client';

export interface OrderWithProducts {
  OrderItem: {
      name: any;
      productId: number;
      quantity: number;
      price: number;
  }[];
  id: string;
  totalAmount: number;
  totalItems: number;
  status: OrderStatus;
  paid: boolean;
  paidAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 08.05.02 Modificar el archivo `orders.service.ts` del microservicio de pedidos para que se pueda conectar con el microservicio de pagos utilizando `NATS`

> 02-Products-App/orders-ms/src/orders/orders.service.ts

```diff
import { HttpStatus, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaClient } from '@prisma/client';
import { OrderPaginationDto } from './dto/order-pagination.dto';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { ChangeOrderStatusDto } from './dto/change-order-status.dto';
import { firstValueFrom } from 'rxjs';
import { NATS_SERVICE } from 'src/config/services';
+import { OrderWithProducts } from './interfaces/order-with-produts.interface';

const debug = false;

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(OrdersService.name);

  
  constructor(
    @Inject(NATS_SERVICE) private readonly client: ClientProxy,
  ) {
    super();
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Connected to database');
  }

  async create(createOrderDto: CreateOrderDto) {
    try {
      //1 Confirmar los ids de los productos
      const productIds = createOrderDto.items.map((item) => item.productId);
      if (debug) {
        this.logger.debug(`Validating products ${productIds}`);
      }
      const products = await firstValueFrom(
        this.client.send({ cmd: 'validate-products' }, { ids: productIds }),
      );
      if (debug) {
        this.logger.debug(`Products validated: ${JSON.stringify(products, null, 2)}`);
      }

      if (!products || products.length === 0) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'Products not found',
        });
      }

      //2. Cálculos de los valores
      const totalAmount = createOrderDto.items.reduce((acc, orderItem) => {
        const price = products.find(
          (product: { id: number; }) => product.id === orderItem.productId,
        ).price;
        const total = price * orderItem.quantity;
        if (debug) {
          this.logger.debug(`Product ${orderItem.productId} price: ${price} total: ${total}`);
        }
        return acc + total;
      }, 0);
      if (debug) {
        this.logger.debug(`Total amount: ${totalAmount}`);
      }

      const totalItems = createOrderDto.items.reduce((acc, orderItem) => {
        return acc + orderItem.quantity;
      }, 0);
      if (debug) {
        this.logger.debug(`Total items: ${totalItems}`);
      }

      //3. Crear una transacción de base de datos
      const order = await this.order.create({
        data: {
          totalAmount: totalAmount,
          totalItems: totalItems,
          OrderItem: {
            createMany: {
              data: createOrderDto.items.map((orderItem) => ({
                price: products.find(
                  (product: { id: number; }) => product.id === orderItem.productId,
                ).price,
                productId: orderItem.productId,
                quantity: orderItem.quantity,
              })),
            },
          },
        },
        include: {
          OrderItem: {
            select: {
              price: true,
              quantity: true,
              productId: true,
            },
          },
        },
      });
      if (debug) {
        this.logger.debug(`Order created: ${JSON.stringify(order, null, 2)}`);
      }

      return {
        ...order,
        OrderItem: order.OrderItem.map((orderItem) => ({
          ...orderItem,
          name: products.find((product: { id: number; }) => product.id === orderItem.productId)
            .name,
        })),
      };
    } catch (error) {
      if (debug) {
        this.logger.debug(`Error creating order: ${error.message}`);
      }
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Check logs',
      });
    }
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
      include: {
        OrderItem: {
          select: {
            price: true,
            quantity: true,
            productId: true,
          },
        },
      },
    });

    if (!order) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Order with id ${id} not found`,
      });
    }
    const productIds = order.OrderItem.map((item) => item.productId);
    const products = await firstValueFrom(
      this.client.send({ cmd: 'validate-products' }, { ids: productIds }),
    );    

    return {
      ...order,
      OrderItem: order.OrderItem.map((orderItem) => ({
        ...orderItem,
        name: products.find((product: { id: number; }) => product.id === orderItem.productId)
          .name,
      })),
    };
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

+ async createPaymentSession(order: OrderWithProducts) {
+
+   const paymentSession = await firstValueFrom(
+     this.client.send('create.payment.session', {
+       orderId: order.id,
+       currency: 'usd',
+       items: order.OrderItem.map( item => ({
+         name: item.name,
+         price: item.price,
+         quantity: item.quantity,
+       }) ),
+     }),
+   );
+
+   return paymentSession;
+ }  
}
```

#### 08.05.03 Modificar el archivo `orders.controller.ts` del microservicio de pedidos para que se pueda conectar con el microservicio de pagos utilizando `NATS`

> 02-Products-App/orders-ms/src/orders/orders.controller.ts

```diff
import { Controller, ParseUUIDPipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ChangeOrderStatusDto } from './dto/change-order-status.dto';
import { OrderPaginationDto } from './dto/order-pagination.dto';
import { OrderWithProducts } from './interfaces/order-with-produts.interface';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @MessagePattern('createOrder')
+ async create(@Payload() createOrderDto: CreateOrderDto) {
+   const order = await this.ordersService.create(createOrderDto);
+   const paymentSession = await this.ordersService.createPaymentSession(order as OrderWithProducts)
+   return {
+     order,
+     paymentSession,
+   }
+ }

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

#### 08.05.04 Añadir el documento `nats.module.ts` en el microservicio de pedidos para que se pueda conectar con el microservicio de pagos utilizando `NATS`

> 02-Products-App/orders-ms/src/orders/transports/nats.module.ts

```typescript
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { NATS_SERVICE, envs } from 'src/config';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: NATS_SERVICE,
        transport: Transport.NATS,
        options: {
          servers: envs.natsServers,
        },
      },
    ]),
  ],
  exports: [
    ClientsModule.register([
      {
        name: NATS_SERVICE,
        transport: Transport.NATS,
        options: {
          servers: envs.natsServers,
        },
      },
    ]),
  ],
})
export class NatsModule {}
```

#### 08.05.05 Modificar el archivo `payments.module.ts` en el microservicio de pagos para que se pueda conectar con el microservicio de pedidos utilizando `NATS`

> 02-Products-App/payments-ms/src/payments/payments.module.ts

```typescript
import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { NatsModule } from './transports/nats.module';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService],
  imports: [NatsModule],
})
export class PaymentsModule {}
```

### 08.06 Arreglar problema con `hot-reloding` cuando se modifica cualquiera de los archivos de los microservicios

- Como estamos utilizando `node:22-slim` en los `Dockerfile` de los microservicios, no soportan `hot-reloading`, por lo que cada vez que se realice un cambio, habrá que reiniciar el contenedor.
- Para evitar tener que reiniciar el contenedor, debemos utilizar `node:22-alpine` en el `Dockerfile` de los microservicios.
- Aquí se puede ver el archivo `Dockerfile` del microservicio de pago:

> 02-Products-App/payments-ms/Dockerfile

```dockerfile
FROM node:22-alpine

WORKDIR /usr/src/app

COPY package.json ./
COPY package-lock.json ./

RUN npm install

COPY . .

EXPOSE 3003
```

#### 08.06.01 Modificar el archivo `payments.service.ts` en el microservicio de pagos para que se pueda conectar con el microservicio de pedidos utilizando `NATS`

- Desde el microservicio de pagos, vamos a enviar un mensaje al microservicio de pedidos utilizando emit de `NATS` para que se actualice el pedido indicando que se ha pagado.

> 02-Products-App/payments-ms/src/payments/payments.service.ts

```diff
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { PaymentSessionDto } from './dto/payment-session.dto';
import { envs } from 'src/config/envs';
import Stripe from 'stripe';
+import { NATS_SERVICE } from 'src/config';
+import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly stripe = new Stripe(envs.stripeSecret);

  constructor(
    @Inject(NATS_SERVICE) private readonly client: ClientProxy
  ) {}

  async createPaymentSession(paymentSessionDto: PaymentSessionDto) {
    const { currency, items, orderId } = paymentSessionDto;

    const lineItems = items.map((item) => {
      return {
        price_data: {
          currency: currency,
          product_data: {
            name: item.name,
          },
          unit_amount: Math.round(item.price * 100), // 20 dólares 2000 / 100 = 20.00 // 15.0000
        },
        quantity: item.quantity,
      };
    });

    const session = await this.stripe.checkout.sessions.create({
      // Colocar aquí el ID de mi orden
      payment_intent_data: {
        metadata: {
          orderId: orderId,
        },
      },
      line_items: lineItems,
      mode: 'payment',
      success_url: envs.stripeSuccessUrl,
      cancel_url: envs.stripeCancelUrl,
    });

    return {
      cancelUrl: session.cancel_url,
      successUrl: session.success_url,
      url: session.url,
    }
  }

  async stripeWebhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature'];

    if (!sig) {
      this.logger.error('Missing stripe signature');
      return res.status(400).send({ error: 'Missing stripe signature' });
    }

    let event: Stripe.Event;

    // Real
    const endpointSecret = envs.stripeEndpointSecret;

    try {
      event = this.stripe.webhooks.constructEvent(
        req['rawBody'],
        sig,
        endpointSecret,
      );
      if (!event) {
        this.logger.error('Invalid event');
        return res.status(400).send({ error: 'Invalid event' });
      }
    } catch (err) {
      this.logger.error(`Webhook Error: ${err.message}`);
      res.status(400).send({ error: `Webhook Error: ${err.message}` });
      return;
    }

    this.logger.log(`Event type received: ${event.type}`);

    switch (event.type) {
      case 'charge.succeeded':
        const chargeSucceeded = event.data.object;
+       const payload = {
+         stripePaymentId: chargeSucceeded.id,
+         orderId: chargeSucceeded.metadata.orderId,
+         receiptUrl: chargeSucceeded.receipt_url,
+       }
+
+       this.client.emit('payment.succeeded', payload );
        break;

      default:
        this.logger.log(`Event ${event.type} not handled`);
    }

    return res.status(200).json({ sig });
  }
}
```

### 08.07 Modificar el microservicio de orders-ms para que se pueda confirmar el pago de una orden

#### 08.07.01 Modificar la base de datos para incluir los campos de pago

##### 08.07.01.01 Modificar el documento `schema.prisma` para incluir los campos de pago

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
  PAID
  DELIVERED
  CANCELLED
}

model Order {
  id          String @id @default(uuid())
  totalAmount Float
  totalItems  Int

  status         OrderStatus @default(PENDING)
  paid           Boolean     @default(false)
  paidAt         DateTime?
  stripeChargeId String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  OrderItem    OrderItem[]
  OrderReceipt OrderReceipt?
}

model OrderItem {
  id        String @id @default(uuid())
  productId Int
  quantity  Int
  price     Float

  Order   Order?  @relation(fields: [orderId], references: [id])
  orderId String?
}

model OrderReceipt {
  id String @id @default(uuid())

  order   Order  @relation(fields: [orderId], references: [id])
  orderId String @unique

  receiptUrl String

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

##### 08.07.01.02 Ejecutar las migraciones

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/orders-ms$
npx prisma migrate dev --name stripe-payment
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "ordersdb", schema "public" at "localhost:5432"

Applying migration `20250412154014_stripe_payment`

The following migration(s) have been created and applied from new schema changes:

migrations/
  └─ 20250412154014_stripe_payment/
    └─ migration.sql

Your database is now in sync with your schema.

✔ Generated Prisma Client (v6.5.0) to ./node_modules/@prisma/client in 116ms

┌─────────────────────────────────────────────────────────┐
│  Update available 6.5.0 -> 6.6.0                        │
│  Run the following to update                            │
│    npm i --save-dev prisma@latest                       │
│    npm i @prisma/client@latest                          │
└─────────────────────────────────────────────────────────┘
```

- Podemos ver que se ha creado el archivo `migrations/20250412154014_stripe_payment/migration.sql` con el siguiente contenido:

```sql
-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'PAID';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "stripeChargeId" TEXT;

-- CreateTable
CREATE TABLE "OrderReceipt" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "receiptUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrderReceipt_orderId_key" ON "OrderReceipt"("orderId");

-- AddForeignKey
ALTER TABLE "OrderReceipt" ADD CONSTRAINT "OrderReceipt_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
```

- Podemos ver en esta imagen que se ha creado la tabla `OrderReceipt` y se ha añadido la columna `stripeChargeId` a la tabla `Order`

![Actualizada la base de datos](nestjs-microservicios.08.001.png)

#### 08.07.02 Crear el DTO que vamos a utilizar para recibir la información del pago

> 02-Products-App/orders-ms/src/orders/dto/paid-order.dto.ts

```typescript
import { IsString, IsUUID, IsUrl } from 'class-validator';

export class PaidOrderDto {
  @IsString()
  stripePaymentId: string;

  @IsString()
  @IsUUID()
  orderId: string;

  @IsString()
  @IsUrl()
  receiptUrl: string;
}
```

#### 08.07.03 Modificar el archivo `orders.service.ts` en el microservicio de pedidos para que se pueda confirmar el pago de una orden

> 02-Products-App/orders-ms/src/orders/orders.service.ts

```diff
import {
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaClient } from '@prisma/client';
import { OrderPaginationDto } from './dto/order-pagination.dto';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { ChangeOrderStatusDto } from './dto/change-order-status.dto';
import { firstValueFrom } from 'rxjs';
import { NATS_SERVICE } from 'src/config/services';
import { OrderWithProducts } from './interfaces/order-with-produts.interface';
+import { PaidOrderDto } from './dto/paid-order.dto';
const debug = false;

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(OrdersService.name);

  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {
    super();
  }

.

+  async paidOrder(paidOrderDto: PaidOrderDto) {
+    this.logger.log('Order Paid');
+    this.logger.log(paidOrderDto);
+    const order = await this.order.update({
+      where: { id: paidOrderDto.orderId },
+      data: {
+        status: 'PAID',
+        paid: true,
+        paidAt: new Date(),
+        stripeChargeId: paidOrderDto.stripePaymentId,
+        // La relación
+        OrderReceipt: {
+          create: {
+            receiptUrl: paidOrderDto.receiptUrl,
+          },
+        },
+      },
+    });
+    return order;
+  }
}
```

#### 08.07.04 Modificar el archivo `orders.controller.ts` en el microservicio de pedidos para que se pueda confirmar el pago de una orden

> 02-Products-App/orders-ms/src/orders/orders.controller.ts

```diff
import { Controller, ParseUUIDPipe } from '@nestjs/common';
+import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ChangeOrderStatusDto } from './dto/change-order-status.dto';
import { OrderPaginationDto } from './dto/order-pagination.dto';
import { OrderWithProducts } from './interfaces/order-with-produts.interface';
+import { PaidOrderDto } from './dto/paid-order.dto';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @MessagePattern('createOrder')
  async create(@Payload() createOrderDto: CreateOrderDto) {
    const order = await this.ordersService.create(createOrderDto);
    const paymentSession = await this.ordersService.createPaymentSession(
      order as OrderWithProducts,
    );

    return {
      order,
      paymentSession,
    };
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

+ @EventPattern('payment.succeeded')
+ paidOrder(@Payload() paidOrderDto: PaidOrderDto) {
+   return this.ordersService.paidOrder(paidOrderDto);
+ }
}
```

- Cuando se paga una orden, se actualiza el estado de la orden a `PAID` y se crea una nueva entrada en la tabla `OrderReceipt` con la URL del recibo.

![Orden pagada](nestjs-microservicios.08.002.png)
