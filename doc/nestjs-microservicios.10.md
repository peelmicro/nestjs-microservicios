# NestJS + Microservicios: Aplicaciones escalables y modulares (parte 10)

- En este documento vamos a documentar el curso [NestJS + Microservicios: Aplicaciones escalables y modulares de Udemy](https://www.udemy.com/course/nestjs-microservicios)

## 10 Creación de imágenes Docker para Producción

### 10.01 Introducción

- Vamos a crear imágenes Docker para producción.
- Actualmente las imágenes que tenemos creadas son las de desarrollo.
- En producción vamos a crear `Dockerfile` documents que crean imágenes en multi-stage para que sean más pequeñas y eficientes.
- También vamos a tener otro archivo `docker-compose.yml` para producción.

### 10.02 No vamos a usar la imagen de `MongoDB` en producción

- Vamos a crear una base de datos en [MongoDB Atlas](https://www.mongodb.com/atlas) para producción para que sea más rápido y eficiente desde el docker-compose.

### 10.03 No vamos a usar `PostgreSQL` en producción

- Vamos a crear una base de datos en [Neon PostgreSQL](https://neon.tech/) para producción para que sea más rápido y eficiente desde el docker-compose.
- Desde la página de clicamos en `Sign Up`

![Sign Up](nestjs-microservicios.10.001.png)

- Nos autenticamos con Google

![Create your free account](nestjs-microservicios.10.002.png)

- Nos pedirá que pongamos un nombre nombre para el proyecto, service provider y la región. Luego clicamos en `Create project`

![Create project](nestjs-microservicios.10.003.png)

- Accedemos a `Connect to your Database`

![Connect to your Database](nestjs-microservicios.10.004.png)

- Tenemos que poner un nombre para la base de datos y copiar la cadena de conexión.

![Create database](nestjs-microservicios.10.005.png)

- Debemos copiar la cadena de conexión en los diferentes documentos `.env` en la variable `DATABASE_URL`

### 10.02 Creación de imágenes para Producción

#### 10.02.01 Creación de Dockerfile para Producción para `client-gateway`

- Vamos a crear un `dockerfile.prod` para producción para el `client-gateway`.

> 02-Products-App/client-gateway/dockerfile.prod

```dockerfile
# Dependencias
FROM node:22-alpine AS deps

WORKDIR /usr/src/app

COPY package.json ./
COPY package-lock.json ./

RUN npm install

# Builder - Construye la aplicación
FROM node:22-alpine AS build

WORKDIR /usr/src/app

# Copiar de deps, los módulos de node
COPY --from=deps /usr/src/app/node_modules ./node_modules


# Copiar todo el codigo fuente de la aplicación
COPY . .

# RUN npm run test
RUN npm run build

RUN npm ci -f --only=production && npm cache clean --force

# Crear la imagen final de Docker
FROM node:22-alpine AS prod

WORKDIR /usr/src/app

COPY --from=build /usr/src/app/node_modules ./node_modules

# Copiar la carpeta de DIST
COPY --from=build /usr/src/app/dist ./dist

ENV NODE_ENV=production

USER node

EXPOSE 3000

CMD [ "node", "dist/main.js" ]
```

#### 10.02.02 Creación de Dockerfile para Producción para `auth-ms`

- Vamos a crear un `dockerfile.prod` para pr    oducción para el `auth-ms`.

> 02-Products-App/auth-ms/dockerfile.prod

```dockerfile
# Dependencias
FROM node:22-alpine AS deps

WORKDIR /usr/src/app

COPY package.json ./
COPY package-lock.json ./

RUN npm install

# Builder - Construye la aplicación
FROM node:22-alpine AS build

WORKDIR /usr/src/app

# Copiar de deps, los módulos de node
COPY --from=deps /usr/src/app/node_modules ./node_modules

# Copiar todo el codigo fuente de la aplicación
COPY . .

RUN npx prisma generate

# RUN npm run test
RUN npm run build

RUN npm ci -f --only=production && npm cache clean --force

# Crear la imagen final de Docker
FROM node:22-alpine AS prod

WORKDIR /usr/src/app

COPY --from=build /usr/src/app/node_modules ./node_modules

# Copiar la carpeta de DIST
COPY --from=build /usr/src/app/dist ./dist

ENV NODE_ENV=production

USER node

EXPOSE 3000

CMD [ "node", "dist/main.js" ]
```

#### 10.02.03 Creación de Dockerfile para Producción para `orders-ms`

- Vamos a crear un `dockerfile.prod` para producción para el `orders-ms`.

> 02-Products-App/orders-ms/dockerfile.prod

```dockerfile
# Dependencias
FROM node:22-alpine AS deps

WORKDIR /usr/src/app

COPY package.json ./
COPY package-lock.json ./

RUN npm install

# Builder - Construye la aplicación
FROM node:22-alpine AS build

WORKDIR /usr/src/app

# Copiar de deps, los módulos de node
COPY --from=deps /usr/src/app/node_modules ./node_modules

# Copiar todo el codigo fuente de la aplicación
COPY . .

# Add build argument and environment variable
ARG ORDERS_DATABASE_URL
ENV ORDERS_DATABASE_URL=$ORDERS_DATABASE_URL

# Generate Prisma client first
RUN npx prisma migrate deploy
RUN npx prisma generate

# Build the app
RUN npm run build

RUN npm ci -f --only=production && npm cache clean --force

# Crear la imagen final de Docker
FROM node:22-alpine AS prod

WORKDIR /usr/src/app

COPY --from=build /usr/src/app/node_modules ./node_modules

# Copiar la carpeta de DIST
COPY --from=build /usr/src/app/dist ./dist

ENV NODE_ENV=production

USER node

EXPOSE 3000

CMD [ "node", "dist/main.js" ]
```

#### 10.02.04 Creación de Dockerfile para Producción para `products-ms`

- Vamos a crear un `dockerfile.prod` para producción para el `products-ms`.

> 02-Products-App/products-ms/dockerfile.prod

```dockerfile
# Dependencias
FROM node:22-alpine AS deps

WORKDIR /usr/src/app

COPY package.json ./
COPY package-lock.json ./

RUN npm install

# Builder - Construye la aplicación
FROM node:22-alpine AS build

WORKDIR /usr/src/app

# Copiar de deps, los módulos de node
COPY --from=deps /usr/src/app/node_modules ./node_modules

# Copiar todo el codigo fuente de la aplicación
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the app
RUN npm run build

RUN npm ci -f --only=production && npm cache clean --force

# Crear la imagen final de Docker
FROM node:22-alpine AS prod

WORKDIR /usr/src/app

COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/prisma ./prisma

ENV NODE_ENV=production

USER node

EXPOSE 3000

CMD [ "node", "dist/main.js" ]
```

#### 10.02.05 Creación de Dockerfile para Producción para `payments-ms`

> 02-Products-App/payments-ms/dockerfile.prod

```dockerfile
# Dependencias
FROM node:22-alpine AS deps

WORKDIR /usr/src/app

COPY package.json ./
COPY package-lock.json ./

RUN npm install

# Builder - Construye la aplicación
FROM node:22-alpine AS build

WORKDIR /usr/src/app

# Copiar de deps, los módulos de node
COPY --from=deps /usr/src/app/node_modules ./node_modules

# Copiar todo el codigo fuente de la aplicación
COPY . .

# RUN npm run test
RUN npm run build

RUN npm ci -f --only=production && npm cache clean --force


# Crear la imagen final de Docker
FROM node:22-alpine AS prod

WORKDIR /usr/src/app

COPY --from=build /usr/src/app/node_modules ./node_modules

# Copiar la carpeta de DIST
COPY --from=build /usr/src/app/dist ./dist

ENV NODE_ENV=production

USER node

EXPOSE 3000

CMD [ "node", "dist/main.js" ]
```

### 10.03 Creación de docker-compose.yml para Producción

- Vamos a crear un `docker-compose.yml` para producción.

> 02-Products-App/docker-compose.prod.yaml

```yaml
services:

  nats-server:
    image: nats:latest
    
  client-gateway:
    build:
      context: ./client-gateway
      dockerfile: dockerfile.prod
    image: client-gateway-prod
    ports:
      - ${CLIENT_GATEWAY_PORT}:${CLIENT_GATEWAY_PORT}
    environment:
      - PORT=${CLIENT_GATEWAY_PORT}
      - NATS_SERVERS=${NATS_SERVERS}

  auth-ms:
    build:
      context: ./auth-ms
      dockerfile: dockerfile.prod
    image: auth-ms
    environment:
      - PORT=3000
      - NATS_SERVERS=${NATS_SERVERS}
      - AUTH_DATABASE_URL=${AUTH_DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}

  products-ms:
    build:
      context: ./products-ms
      dockerfile: dockerfile.prod
    image: products-ms
    environment:
      - PORT=3000
      - NATS_SERVERS=${NATS_SERVERS}
      - PRODUCTS_DATABASE_URL=${PRODUCTS_DATABASE_URL}
  
  orders-ms:
    build: 
      context: ./orders-ms
      dockerfile: dockerfile.prod
      args:
        - ORDERS_DATABASE_URL=${ORDERS_DATABASE_URL}
    image: orders-ms
    environment:
      - PORT=3000
      - ORDERS_DATABASE_URL=${ORDERS_DATABASE_URL}
      - NATS_SERVERS=${NATS_SERVERS}

  payments-ms:
    build:
      context: ./payments-ms
      dockerfile: dockerfile.prod
    image: payments-ms
    ports:
      - ${PAYMENTS_MS_PORT}:${PAYMENTS_MS_PORT}
    environment:
      - PORT=${PAYMENTS_MS_PORT}
      - NATS_SERVERS=${NATS_SERVERS}
      - STRIPE_SECRET=${STRIPE_SECRET}
      - STRIPE_SUCCESS_URL=${STRIPE_SUCCESS_URL}
      - STRIPE_CANCEL_URL=${STRIPE_CANCEL_URL}
      - STRIPE_ENDPOINT_SECRET=${STRIPE_ENDPOINT_SECRET}
```

### 10.05 Creación del documento `.env` para producción

> 02-Products-App/.env

```text
CLIENT_GATEWAY_PORT=3000

# https://dashboard.stripe.com/test/apikeys
STRIPE_SECRET=sk_test_
STRIPE_SUCCESS_URL=http://localhost:3003/payments/success
STRIPE_CANCEL_URL=http://localhost:3003/payments/cancel

# https://dashboard.stripe.com/test/webhooks/we_1OrjjpLpSSVtW50ltIQEAP8z
# Este es el signing secret del webhook
STRIPE_ENDPOINT_SECRET=whsec_

# NATS_SERVERS="nats://localhost:4222,nats://localhost:4223"
NATS_SERVERS=nats://nats-server:4222

AUTH_MS_PORT=3004

# development
# AUTH_DATABASE_URL=mongodb+srv://xxxxxxxx:pppppppp@auth-microservice-db.8bpm1ia.mongodb.net/AuthDB
# production
AUTH_DATABASE_URL=mongodb+srv://xxxxxxxx:pppppppp@testing.q6ff3cq.mongodb.net/AuthDB
JWT_SECRET=OtroStringSeguroIriaAQUI

# development
# ORDERS_DATABASE_URL="postgresql://postgres:example@localhost:5432/ordersdb"

# production
ORDERS_DATABASE_URL="postgresql://neondb_owner:ttttttt@ep-steep-river-a2p3lezj-pooler.eu-central-1.aws.neon.tech/orders-db?sslmode=require"

PRODUCTS_DATABASE_URL="file:./dev.db"
```

### 10.07 Generación de la imagen de Docker para producción

```bash
docker compose -f docker-compose.prod.yaml build
```

- Una vez generada la imagen, tenemos que asegurarnos de que todos los servicios estén funcionando.

```bash
docker compose -f docker-compose.prod.yaml up -d
```

![Docker Compose](nestjs-microservicios.10.006.png)

