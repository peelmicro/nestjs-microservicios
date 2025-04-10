# NestJS + Microservicios: Aplicaciones escalables y modulares (parte 6)

- En este documento vamos a documentar el curso [NestJS + Microservicios: Aplicaciones escalables y modulares de Udemy](https://www.udemy.com/course/nestjs-microservicios)

## 06 Dockenizar la solución

### 06.01 Introducción

- Vamos a dockenizar la solución para poder lanzarla desde varios contenedores.
- Vamos a utilizar docker compose para lanzar los contenedores.
- Actualmente ya tenemos un fichero `docker-compose.yml` en la raíz del proyecto que utilizamos para poder ustilizar la base de datos de Postgres.

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

- Necesitamos añadir los servicios de los microservicios que vamos a lanzar.
  - Un servicio para el cliente gateway
  - Un servicio para el microservicio de productos
  - Un servicio para el microservicio de pedidos
- También vamos a añadir el servicio de NATS.

### 06.02 Actualización del fichero docker-compose.yml para incluir NATS

- Vamos a crear el documentos `dockerignore` para el root del proyecto.

> 02-Products-App/.dockerignore

```text
dist/
node_modules/
.env
.vscode/
```

- Vamos a añadir el servicio de NATS al fichero `docker-compose.yml`.

> 02-Products-App/docker-compose.yml

```diff
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

+ nats-server:
+   image: nats:latest
+   ports:
+     - "8222:8222"
+     - "4222:4222"

volumes:
  postgres_data:
```

- Debemos asegurarnos de que se levanta el servicio de NATS cuando ejecutamos el comando `docker compose up`.
- Levantando los servicios de client gateway, products y orders, tenemos que asegurarnos de que todo funcione correctamente como hasta ahora.

### 06.03 Creación del fichero Dockerfile para el cliente gateway

- Vamos a crear el documento `dockerignore` para el cliente gateway.

> 02-Products-App/client-gateway/.dockerignore

```text
dist/
node_modules/
.env
.vscode/
```

- Vamos a crear el fichero `Dockerfile` para el cliente gateway.

> 02-Products-App/client-gateway/Dockerfile

```dockerfile
FROM node:22-slim

WORKDIR /usr/src/app

COPY package.json ./
COPY package-lock.json ./

RUN npm install

COPY . .

EXPOSE 3000
```

- Vamos a actualizar el fichero `docker-compose.yml` para incluir el servicio del cliente gateway.

> 02-Products-App/docker-compose.yml

```diff
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

  nats-server:
    image: nats:latest
    ports:
      - "8222:8222"
      - "4222:4222"

+ client-gateway:
+   build: ./client-gateway
+   ports:
+     - "3000:3000"
+   volumes:
+     - ./client-gateway/src:/usr/src/app/src
+   command: npm run start:dev
+   environment:
+     - PORT=3000
+     - NATS_SERVERS=nats://nats-server:4222

volumes:
  postgres_data:
```

- Una vez parado el servicio de client gateway, y parado docker compose (con `docker compose down`), vamos a crear iniciar `docker-compose.yml` ejecutando el comando `docker compose up`.
- Tenemos que asegurarnos de que el servicio de client gateway se levanta correctamente.
- Tenemos que probar que podemos ejecutar las peticiones HTTP al cliente gateway y que todo funciona correctamente.
- Hay que asegurarse de que los servicios de products y orders se están ejecutando correctamente, levantándolos manualmente con `npm run start:dev`.

### 06.04 Creación del fichero Dockerfile para el microservicio de productos

- Vamos a modificar el fichero `package.json` del microservicio de productos para que se genere el fichero `schema.prisma` con el comando `npx prisma generate`.

> 02-Products-App/products-ms/package.json

```diff
{
  "name": "products-ms",
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
+   "docker:start": "prisma migrate dev && prisma generate && npm run start:dev"
  } 
}
```

- Vamos a crear el documento `dockerignore` para el microservicio de productos.

> 02-Products-App/products/.dockerignore

```text
dist/
node_modules/
.env
.vscode/
```

- Vamos a crear el fichero `Dockerfile` para el microservicio de productos.

> 02-Products-App/products/Dockerfile

```dockerfile
FROM node:22-slim

WORKDIR /usr/src/app

COPY package.json ./
COPY package-lock.json ./

RUN npm install

COPY . .

EXPOSE 3001
```

- Vamos a actualizar el fichero `docker-compose.yml` para incluir el servicio del microservicio de productos.

> 02-Products-App/docker-compose.yml

```diff
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

  nats-server:
    image: nats:latest
    ports:
      - "8222:8222"
      - "4222:4222"

  client-gateway:
    build: ./client-gateway
    ports:
      - "3000:3000"
    volumes:
      - ./client-gateway/src:/usr/src/app/src
    command: npm run start:dev
    environment:
      - PORT=3000
      - NATS_SERVERS=nats://nats-server:4222

+ products-ms:
+   build: ./products-ms
+   volumes:
+     - ./products-ms/src:/usr/src/app/src
+   command: npm run docker:start
+   environment:
+     - PORT=3001
+     - NATS_SERVERS=nats://nats-server:4222
+     - DATABASE_URL=file:./dev.db      

volumes:
  postgres_data:
```

- Una vez parado el servicio de products, y parado docker compose (con `docker compose down`), vamos a crear iniciar `docker-compose.yml` ejecutando el comando `docker compose up`.
- Tenemos que asegurarnos de que el servicio de products se levanta correctamente.
- Hay que asegurarse de que el servicio de orders se está ejecutando correctamente, levantándolo manualmente con `npm run start:dev`.
- Tenemos que probar que podemos ejecutar las peticiones HTTP al products y que todo funciona correctamente.
- Tenemos que probar que podemos ejecutar las peticiones HTTP al orders y que todo funciona correctamente.

### 06.05 Creación del fichero Dockerfile para el microservicio de pedidos

- Vamos a modificar el fichero `package.json` del microservicio de pedidos para que se genere el fichero `schema.prisma` con el comando `npx prisma generate`.

> 02-Products-App/orders/package.json

```diff
{
  "name": "orders-ms",
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
+   "docker:start": "prisma migrate dev && prisma generate && npm run start:dev"
  }
}
```

- Vamos a crear el documento `dockerignore` para el microservicio de pedidos.

> 02-Products-App/orders/.dockerignore

```text
dist/
node_modules/
.env
.vscode/
```

- Vamos a crear el fichero `Dockerfile` para el microservicio de pedidos.

> 02-Products-App/orders/Dockerfile

```dockerfile
FROM node:22-slim

WORKDIR /usr/src/app

COPY package.json ./
COPY package-lock.json ./

RUN npm install

COPY . .

EXPOSE 3002
```

- Vamos a actualizar el fichero `docker-compose.yml` para incluir el servicio del microservicio de pedidos.

> 02-Products-App/docker-compose.yml

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
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  nats-server:
    image: nats:latest
    ports:
      - "8222:8222"
      - "4222:4222"

  client-gateway:
    build: ./client-gateway
    ports:
      - "3000:3000"
    volumes:
      - ./client-gateway/src:/usr/src/app/src
    command: npm run start:dev
    environment:
      - PORT=3000
      - NATS_SERVERS=nats://nats-server:4222

  products-ms:
    build: ./products-ms
    volumes:
      - ./products-ms/src:/usr/src/app/src
    command: npm run docker:start
    environment:
      - PORT=3001
      - NATS_SERVERS=nats://nats-server:4222
      - DATABASE_URL=file:./dev.db

  orders-ms:
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

volumes:
  postgres_data:
```

- Una vez parado el servicio de orders, y parado docker compose (con `docker compose down`), vamos a crear iniciar `docker-compose.yml` ejecutando el comando `docker compose up --build`.
- Tenemos que asegurarnos de que el servicio de orders se levanta correctamente.
- Tenemos que probar que podemos ejecutar las peticiones HTTP al orders y que todo funciona correctamente.
- Tenemos que probar que podemos ejecutar las peticiones HTTP al products y que todo funciona correctamente.

### 06.06 Creaciión de variables de entorno para el docker compose

- Podemos crear variables de entorno para el docker compose creando un fichero `.env` en el root del proyecto.

> 02-Products-App/.env

```text
CLIENT_GATEWAY_PORT=3000
```

- Para que docker compose pueda utilizar las variables de entorno, tenemos que acceder a ellas utilizando el nombre de la variable de entorno entre corchetes.

> 02-Products-App/docker-compose.yaml

```diff
.
  client-gateway:
    build: ./client-gateway
    ports:
      - "${CLIENT_GATEWAY_PORT}:3000"
.      
```

### 06.07 Expandir el `custom exception filter` para mandar información cuando un servicio no esté disponible

- Vamos a crear un nuevo fichero `exception.filter.ts` en el microservicio de pedidos.

> 02-Products-App/orders/src/exception.filter.ts

```diff
import {
  Catch,
  ArgumentsHost,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';

import { RpcException } from '@nestjs/microservices';

@Catch(RpcException)
export class RpcCustomExceptionFilter implements ExceptionFilter {
  catch(exception: RpcException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const rpcError = exception.getError();

+   if (rpcError.toString().includes('Empty response')) {
+     return response.status(500).json({
+       status: 500,
+       message: rpcError
+         .toString()
+         .substring(0, rpcError.toString().indexOf('(') - 1),
+     });
+   }

    if (
      typeof rpcError === 'object' &&
      'status' in rpcError &&
      'message' in rpcError
    ) {
      const status = isNaN(Number(rpcError.status))
        ? HttpStatus.BAD_REQUEST
        : Number(rpcError.status);
      return response.status(status).json(rpcError);
    }

    response.status(HttpStatus.BAD_REQUEST).json({
      status: HttpStatus.BAD_REQUEST,
      message: rpcError,
    });
  }
}
```

- Vamos a actualizar el fichero `docker-compose.yml` para incluir el servicio del microservicio de pedidos.

> 02-Products-App/docker-compose.yml

