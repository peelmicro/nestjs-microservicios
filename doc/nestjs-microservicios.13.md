# NestJS + Microservicios: Aplicaciones escalables y modulares (parte 13)

- En este documento vamos a documentar el curso [NestJS + Microservicios: Aplicaciones escalables y modulares de Udemy](https://www.udemy.com/course/nestjs-microservicios)

## 13 Implementar Kubernetes para desplegar nuestra aplicación en un cluster de Google Kubernetes Engine

### 13.01 Desplegar Kubernetes en GCloud - Google Kubernetes Engine

- Vamos a desplegar Kubernetes en GCloud -Google Kubernetes Engine.
- Necesitamos realizar el balanceo de carga de nuestra aplicación.
- Necesitamos configurar los puertos para el cliente gateway y para el webhook de Stripe.
- Vamos a crear un endpoint de healthcheck para que Kubernetes sepa que nuestra aplicación está funcionando.

### 13.02 Creación de healthcheck enpoints

- Vamos a crear un endpoint de healthcheck para que Kubernetes que nos aseguremos que nuestra aplicación está funcionando.
- Vamos a levantar el docker-compose.yaml en modo de desarrollo para probar el healthcheck.
- Empezamos añadiendo `--build` para asegurarnos de que se regeneran las imágenes de los servicios.

```bash
docker-compose up --build
```

### 13.03 Modificar el `client-gateway` para que añadir un nuevo endpoint de healthcheck

- Anadimos el nuevo `health-check.controller.ts` en el directorio `src/health-check`.

> 02-Products-App/client-gateway/src/health-check/health-check.controller.ts

```typescript
import { Controller, Get } from '@nestjs/common';

@Controller('/')
export class HealthCheckController {
  @Get()
  healthCheck() {
    return 'Client Gateway is up and running!!';
  }
}
```

- Añadimos el nuevo documento de `health-check.module.ts` en el directorio `src/health-check`.

> 02-Products-App/client-gateway/src/health-check/health-check.module.ts

```typescript
import { Module } from '@nestjs/common';
import { HealthCheckController } from './health-check.controller';

@Module({
  controllers: [HealthCheckController]
})
export class HealthCheckModule {}
```

- Añadimos el nuevo endpoint de healthcheck en el archivo `app.module.ts` de `client-gateway`.

> 02-Products-App/client-gateway/src/app.module.ts

```typescript
import { Module } from '@nestjs/common';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { NatsModule } from './transports/nats.module';
import { AuthModule } from './auth/auth.module';
import { HealthCheckModule } from './health-check/health-check.module';

@Module({
  imports: [
    ProductsModule,
    OrdersModule,
    NatsModule,
    AuthModule,
    HealthCheckModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

- Necesitamos modificar el `main.ts` para que se pueda acceder al endpoint `/` ya que por defecto está configurado para acceder al endpoint `/api`.

> 02-Products-App/client-gateway/src/main.ts

```diff
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { envs } from './config';
import { Logger, RequestMethod, ValidationPipe } from '@nestjs/common';
import { RpcCustomExceptionFilter } from './common';

async function bootstrap() {
  const logger = new Logger('Main-Gateway');

  const app = await NestFactory.create(AppModule);

+ app.setGlobalPrefix('api', {
+   exclude: [{
+     path: '',
+     method: RequestMethod.GET,
+   }]
+ });
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new RpcCustomExceptionFilter())

  await app.listen(envs.port);

  logger.log(`Gateway running on port ${envs.port}`);
}
bootstrap();
```

- Añadimos el documento `health-check.http` para probar el endpoint de healthcheck.

> 02-Products-App/client-gateway/health-check.http

```http
@url = http://localhost:3000/

# URL del microservicio de client-gateway
# @url = http://localhost:30940/

### Comprobar que el healthcheck está funcionando
GET {{url}}
```

- Ejecutamos la petición `GET {{url}}` y recibimos esta respuesta:

```JSON
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: text/html; charset=utf-8
Content-Length: 34
ETag: W/"22-4YCOYFdj1PXTn51wWnfhJ7lkvxg"
Date: Sat, 19 Apr 2025 04:52:26 GMT
Connection: close

Client Gateway is up and running!!
```

- Tenemos que añadir el endpoint de healthcheck porque es requerido por Google Kubernetes Engine para que sepa que nuestra aplicación está funcionando.

### 13.04 Modificar el `payments-ms` para que añadir un nuevo endpoint de healthcheck

- Anadimos el nuevo `health-check.controller.ts` en el directorio `src/health-check`.

> 02-Products-App/payments-ms/src/health-check/health-check.controller.ts

```typescript
import { Controller, Get } from '@nestjs/common';

@Controller('/')
export class HealthCheckController {
  @Get()
  healthCheck() {
    return 'Payments-ms is up and running!!';
  }
}
```

- Añadimos el nuevo documento de `health-check.module.ts` en el directorio `src/health-check`.

> 02-Products-App/client-gateway/src/health-check/health-check.module.ts

```typescript
import { Module } from '@nestjs/common';
import { HealthCheckController } from './health-check.controller';

@Module({
  controllers: [HealthCheckController]
})
export class HealthCheckModule {}
```

- Añadimos el nuevo endpoint de healthcheck en el archivo `app.module.ts` de `client-gateway`.

> 02-Products-App/client-gateway/src/app.module.ts

```typescript
import { Module } from '@nestjs/common';
import { PaymentsModule } from './payments/payments.module';
import { HealthCheckModule } from './health-check/health-check.module';

@Module({
  imports: [PaymentsModule, HealthCheckModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

- No necesitamos modificar el `main.ts` para que se pueda acceder al endpoint `/` ya que por defecto está configurado así.
- Añadimos el documento `health-check.http` para probar el endpoint de healthcheck.

> 02-Products-App/payments-ms/health-check.http

```http
@url = http://localhost:3003/

# URL del servicio de payment-ms
# @url = http://localhost:32697/

### Comprobar que el healthcheck está funcionando
GET {{url}}
```

- Ejecutamos la petición `GET {{url}}` y recibimos esta respuesta:

```JSON
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: text/html; charset=utf-8
Content-Length: 31
ETag: W/"1f-1c8bk3T1EsEX8Iw9uzBYtcJpEa8"
Date: Sat, 19 Apr 2025 05:02:38 GMT
Connection: close

Payments-ms is up and running!!
```
