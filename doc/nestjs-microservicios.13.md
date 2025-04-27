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

### 13.05 Configurar Google Kubernetes Engine (GKE) en GCloud

- Tenemos que buscar y seleccionar `Kubernetes Engine` en el menú de navegación de GCloud.

#### 13.05.01 Habilitar el API de Kubernetes Engine

- Una vez dentro, nos pregunta si queremos habilitar el API de Kubernetes Engine, clicamos en `Enable`.

![Enable Kubernetes Engine API](nestjs-microservicios.13.001.png)

#### 13.05.02 Crear el cluster

- Una vez habilitado el API, nos vamos a la sección `Clusters` y clicamos en `Create Cluster`.

![Create Cluster](nestjs-microservicios.13.002.png)

- Ignoramos el mensaje de `Cluster Creator` porque lo vamos a crear manualmente.

![Cluster Creator](nestjs-microservicios.13.003.png)

- Le vamos a dar un nombre al cluster, por ejemplo `nestjs-microservicios-cluster`.
- Le vamos a dar una zona, por ejemplo `europe-southwest1`, que es donde se encuentras las imágenes de Docker.
- El resto de opciones, dejamos las que vienen por defecto.
- Clickamos en `Create`.

![Create Cluster](nestjs-microservicios.13.004.png)

- Tenemos que esperar a que se cree el cluster.

![Creating Cluster](nestjs-microservicios.13.005.png)

- Una vez creado el cluster, seleccionamos el cluster.

![Cluster Created](nestjs-microservicios.13.006.png)

#### 13.05.03 Conectar al cluster

- Clickamos en `Connect`.

![Connect](nestjs-microservicios.13.007.png)

- Copiamos el comando de `Connect`: `gcloud container clusters get-credentials nestjs-microservicios-cluster --region europe-southwest1 --project nestjs-microservicios-456909`.

![Connect Command](nestjs-microservicios.13.008.png)

- Tenemos que asegurarnos que estamos en `docker-desktop` ejecutando el siguiente comando y viendo cuál empieza por asterico.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
kubectl config get-contexts
CURRENT   NAME                                                 CLUSTER                                              AUTHINFO                                             NAMESPACE
          arn:aws:eks:eu-north-1:072929378285:cluster/jobber   arn:aws:eks:eu-north-1:072929378285:cluster/jobber   arn:aws:eks:eu-north-1:072929378285:cluster/jobber   
*         docker-desktop                                       docker-desktop                                       docker-desktop                                       
          iam-root-account@jobber.eu-north-1.eksctl.io         jobber.eu-north-1.eksctl.io                          iam-root-account@jobber.eu-north-1.eksctl.io         
          minikube                                             minikube                                             minikube                                             default
```

- Si no estamos en `docker-desktop`, lo podemos cambiar ejecutando el siguiente comando:

```bash
kubectl config use-context docker-desktop
```

- Ahora copiamos el comando de `Connect` y lo pegamos en el terminal.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
gcloud container clusters get-credentials nestjs-microservicios-cluster --region europe-southwest1 --project nestjs-microservicios-456909
Fetching cluster endpoint and auth data.
CRITICAL: ACTION REQUIRED: gke-gcloud-auth-plugin, which is needed for continued use of kubectl, was not found or is not executable. Install gke-gcloud-auth-plugin for use with kubectl by following https://cloud.google.com/kubernetes-engine/docs/how-to/cluster-access-for-kubectl#install_plugin
kubeconfig entry generated for nestjs-microservicios-cluster.
```

#### 13.05.04 Instalar el plugin de `gke-gcloud-auth-plugin`

- Accediendo a ese enlace, podemos ver que tenemos que instalar el plugin de `gke-gcloud-auth-plugin`.

![Install gke-gcloud-auth-plugin - 1](nestjs-microservicios.13.009.png)

![Install gke-gcloud-auth-plugin - 2](nestjs-microservicios.13.010.png)

- Tenemos que asegurarnos de que `gke-gcloud-auth-plugin` está instalado.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
gke-gcloud-auth-plugin --version
gke-gcloud-auth-plugin: command not found
```

- Si no está instalado, lo instalamos ejecutando el siguiente comando:
- Aunque antes tenemos que asegurarnos de que estamos en la configuración de desarrollo ejecutando el siguiente comando:

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
gcloud config configurations activate nestjs-microservicios
Activated [nestjs-microservicios].
```

- Ahora podemos instalar el plugin ejecutando el siguiente comando:

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
gcloud components install gke-gcloud-auth-plugin
ERROR: (gcloud.components.install) 
You cannot perform this action because the Google Cloud CLI component manager 
is disabled for this installation. You can run the following command 
to achieve the same result for this installation: 

sudo apt-get install google-cloud-cli-gke-gcloud-auth-plugin
```

- Como da error, vamos a instalar el plugin manualmente ejecutando el comando que sugiere:

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$ sudo apt-get install google-cloud-cli-gke-gcloud-auth-plugin
Reading package lists... Done
Building dependency tree... Done
Reading state information... Done
E: Unable to locate package google-cloud-cli-gke-gcloud-auth-plugin
```

- Como da error otra vez, vamos a instalar el plugin manualmente ejecutando primero el siguiente comando:

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list
deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main
```

- Ahora, vamos a descargar el Google Cloud public key:

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key --keyring /usr/share/keyrings/cloud.google.gpg add -
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
  0     0    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0Warning: apt-key is deprecated. Manage keyring files in trusted.gpg.d instead (see apt-key(8)).
100  1022  100  1022    0     0   9308      0 --:--:-- --:--:-- --:--:--  9376
OK
```

- Ahora, vamos a instalar el plugin ejecutando el siguiente comando:

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
sudo apt-get update && sudo apt-get install google-cloud-cli-gke-gcloud-auth-plugin
Hit:1 https://download.docker.com/linux/ubuntu noble InRelease
Hit:2 http://dl.google.com/linux/chrome/deb stable InRelease                                                        
Get:3 https://esm.ubuntu.com/apps/ubuntu noble-apps-updates InRelease [7,480 B]                                     
Hit:4 http://archive.ubuntu.com/ubuntu noble InRelease                                                              
Get:5 https://packages.cloud.google.com/apt cloud-sdk InRelease [1,618 B]                                           
Get:6 https://esm.ubuntu.com/apps/ubuntu noble-apps-security InRelease [7,595 B]                                    
Get:7 https://esm.ubuntu.com/infra/ubuntu noble-infra-security InRelease [7,474 B]                                  
Get:8 https://esm.ubuntu.com/infra/ubuntu noble-infra-updates InRelease [7,473 B]                                   
Hit:9 https://repo.pritunl.com/stable/apt noble InRelease                                                           
Get:10 http://archive.ubuntu.com/ubuntu noble-updates InRelease [126 kB]                                            
Hit:11 https://windsurf-stable.codeiumdata.com/wVxQEIWkwPUEAGf3/apt stable InRelease                                
Hit:12 https://deb.tableplus.com/debian/24 tableplus InRelease                                                      
Hit:13 https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 InRelease                                          
Hit:14 http://repo.mysql.com/apt/ubuntu noble InRelease                                                             
Hit:15 https://dbeaver.io/debs/dbeaver-ce  InRelease                                                                
Hit:16 http://archive.ubuntu.com/ubuntu noble-backports InRelease   
Get:17 https://packages.cloud.google.com/apt cloud-sdk/main amd64 Packages [3,727 kB]
Hit:18 https://www.synaptics.com/sites/default/files/Ubuntu stable InRelease
Get:19 https://packages.cloud.google.com/apt cloud-sdk/main all Packages [1,683 kB]
Get:20 https://packages.cloud.google.com/apt cloud-sdk/main i386 Packages [935 kB]
Hit:21 http://security.ubuntu.com/ubuntu noble-security InRelease
Ign:22 https://releases.warp.dev/linux/deb stable InRelease
Hit:23 https://releases.warp.dev/linux/deb stable Release
Fetched 6,504 kB in 6s (1,169 kB/s)
Reading package lists... Done
W: Target Packages (main/binary-amd64/Packages) is configured multiple times in /etc/apt/sources.list.d/google-cloud-sdk.list:1 and /etc/apt/sources.list.d/google-cloud-sdk.list:2
W: Target Packages (main/binary-i386/Packages) is configured multiple times in /etc/apt/sources.list.d/google-cloud-sdk.list:1 and /etc/apt/sources.list.d/google-cloud-sdk.list:2
W: Target Packages (main/binary-all/Packages) is configured multiple times in /etc/apt/sources.list.d/google-cloud-sdk.list:1 and /etc/apt/sources.list.d/google-cloud-sdk.list:2
W: Target Translations (main/i18n/Translation-en_IE) is configured multiple times in /etc/apt/sources.list.d/google-cloud-sdk.list:1 and /etc/apt/sources.list.d/google-cloud-sdk.list:2
W: Target Translations (main/i18n/Translation-en) is configured multiple times in /etc/apt/sources.list.d/google-cloud-sdk.list:1 and /etc/apt/sources.list.d/google-cloud-sdk.list:2
W: Target Translations (main/i18n/Translation-es) is configured multiple times in /etc/apt/sources.list.d/google-cloud-sdk.list:1 and /etc/apt/sources.list.d/google-cloud-sdk.list:2
W: Target DEP-11 (main/dep11/Components-amd64.yml) is configured multiple times in /etc/apt/sources.list.d/google-cloud-sdk.list:1 and /etc/apt/sources.list.d/google-cloud-sdk.list:2
W: Target DEP-11 (main/dep11/Components-all.yml) is configured multiple times in /etc/apt/sources.list.d/google-cloud-sdk.list:1 and /etc/apt/sources.list.d/google-cloud-sdk.list:2
W: Target DEP-11-icons-small (main/dep11/icons-48x48.tar) is configured multiple times in /etc/apt/sources.list.d/google-cloud-sdk.list:1 and /etc/apt/sources.list.d/google-cloud-sdk.list:2
W: Target DEP-11-icons (main/dep11/icons-64x64.tar) is configured multiple times in /etc/apt/sources.list.d/google-cloud-sdk.list:1 and /etc/apt/sources.list.d/google-cloud-sdk.list:2
W: Target DEP-11-icons-hidpi (main/dep11/icons-64x64@2.tar) is configured multiple times in /etc/apt/sources.list.d/google-cloud-sdk.list:1 and /etc/apt/sources.list.d/google-cloud-sdk.list:2
W: Target DEP-11-icons-large (main/dep11/icons-128x128.tar) is configured multiple times in /etc/apt/sources.list.d/google-cloud-sdk.list:1 and /etc/apt/sources.list.d/google-cloud-sdk.list:2
W: Target CNF (main/cnf/Commands-amd64) is configured multiple times in /etc/apt/sources.list.d/google-cloud-sdk.list:1 and /etc/apt/sources.list.d/google-cloud-sdk.list:2
W: Target CNF (main/cnf/Commands-all) is configured multiple times in /etc/apt/sources.list.d/google-cloud-sdk.list:1 and /etc/apt/sources.list.d/google-cloud-sdk.list:2
W: Target Packages (main/binary-amd64/Packages) is configured multiple times in /etc/apt/sources.list.d/google-cloud-sdk.list:1 and /etc/apt/sources.list.d/google-cloud-sdk.list:2
W: Target Packages (main/binary-i386/Packages) is configured multiple times in /etc/apt/sources.list.d/google-cloud-sdk.list:1 and /etc/apt/sources.list.d/google-cloud-sdk.list:2
W: Target Packages (main/binary-all/Packages) is configured multiple times in /etc/apt/sources.list.d/google-cloud-sdk.list:1 and /etc/apt/sources.list.d/google-cloud-sdk.list:2
W: Target Translations (main/i18n/Translation-en_IE) is configured multiple times in /etc/apt/sources.list.d/google-cloud-sdk.list:1 and /etc/apt/sources.list.d/google-cloud-sdk.list:2
W: Target Translations (main/i18n/Translation-en) is configured multiple times in /etc/apt/sources.list.d/google-cloud-sdk.list:1 and /etc/apt/sources.list.d/google-cloud-sdk.list:2
W: Target Translations (main/i18n/Translation-es) is configured multiple times in /etc/apt/sources.list.d/google-cloud-sdk.list:1 and /etc/apt/sources.list.d/google-cloud-sdk.list:2
W: Target DEP-11 (main/dep11/Components-amd64.yml) is configured multiple times in /etc/apt/sources.list.d/google-cloud-sdk.list:1 and /etc/apt/sources.list.d/google-cloud-sdk.list:2
W: Target DEP-11 (main/dep11/Components-all.yml) is configured multiple times in /etc/apt/sources.list.d/google-cloud-sdk.list:1 and /etc/apt/sources.list.d/google-cloud-sdk.list:2
W: Target DEP-11-icons-small (main/dep11/icons-48x48.tar) is configured multiple times in /etc/apt/sources.list.d/google-cloud-sdk.list:1 and /etc/apt/sources.list.d/google-cloud-sdk.list:2
W: Target DEP-11-icons (main/dep11/icons-64x64.tar) is configured multiple times in /etc/apt/sources.list.d/google-cloud-sdk.list:1 and /etc/apt/sources.list.d/google-cloud-sdk.list:2
W: Target DEP-11-icons-hidpi (main/dep11/icons-64x64@2.tar) is configured multiple times in /etc/apt/sources.list.d/google-cloud-sdk.list:1 and /etc/apt/sources.list.d/google-cloud-sdk.list:2
W: Target DEP-11-icons-large (main/dep11/icons-128x128.tar) is configured multiple times in /etc/apt/sources.list.d/google-cloud-sdk.list:1 and /etc/apt/sources.list.d/google-cloud-sdk.list:2
W: Target CNF (main/cnf/Commands-amd64) is configured multiple times in /etc/apt/sources.list.d/google-cloud-sdk.list:1 and /etc/apt/sources.list.d/google-cloud-sdk.list:2
W: Target CNF (main/cnf/Commands-all) is configured multiple times in /etc/apt/sources.list.d/google-cloud-sdk.list:1 and /etc/apt/sources.list.d/google-cloud-sdk.list:2
Reading package lists... Done
Building dependency tree... Done
Reading state information... Done
The following NEW packages will be installed:
  google-cloud-cli-gke-gcloud-auth-plugin
0 upgraded, 1 newly installed, 0 to remove and 8 not upgraded.
Need to get 2,856 kB of archives.
After this operation, 9,506 kB of additional disk space will be used.
Get:1 https://packages.cloud.google.com/apt cloud-sdk/main amd64 google-cloud-cli-gke-gcloud-auth-plugin amd64 518.0.0-0 [2,856 kB]
Fetched 2,856 kB in 1s (3,332 kB/s)                               
Selecting previously unselected package google-cloud-cli-gke-gcloud-auth-plugin.
(Reading database ... 543318 files and directories currently installed.)
Preparing to unpack .../google-cloud-cli-gke-gcloud-auth-plugin_518.0.0-0_amd64.deb ...
Unpacking google-cloud-cli-gke-gcloud-auth-plugin (518.0.0-0) ...
Setting up google-cloud-cli-gke-gcloud-auth-plugin (518.0.0-0) ...
```

- Ahora, vamos a verificar que el plugin está instalado ejecutando el siguiente comando:

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
gke-gcloud-auth-plugin --version
Kubernetes v1.30.0+03fcd0f8cb9eac57e97a3ed59c702bad8c73be81
```

- Ahora tenemos que actualizar `kubectl` para usar el plugin de `gke-gcloud-auth-plugin`.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
gcloud container clusters get-credentials nestjs-microservicios-cluster \
    --region=europe-southwest1
Fetching cluster endpoint and auth data.
kubeconfig entry generated for nestjs-microservicios-cluster.
```

#### 13.05.05 Conectar al cluster otra vez

- Ahora copiamos el comando de `Connect` otra vez y lo pegamos en el terminal.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
gcloud container clusters get-credentials nestjs-microservicios-cluster --region europe-southwest1 --project nestjs-microservicios-456909
Fetching cluster endpoint and auth data.
kubeconfig entry generated for nestjs-microservicios-cluster.
```

#### 13.05.06 Asegurarnos que estamos apuntando al cluster correcto

- Ahora, vamos a asegurarnos de que estamos apuntando al cluster correcto ejecutando el siguiente comando:

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
kubectl config get-contexts
CURRENT   NAME                                                                               CLUSTER                                                                            AUTHINFO                                                                           NAMESPACE
          arn:aws:eks:eu-north-1:072929378285:cluster/jobber                                 arn:aws:eks:eu-north-1:072929378285:cluster/jobber                                 arn:aws:eks:eu-north-1:072929378285:cluster/jobber                                 
          docker-desktop                                                                     docker-desktop                                                                     docker-desktop                                                                     
*         gke_nestjs-microservicios-456909_europe-southwest1_nestjs-microservicios-cluster   gke_nestjs-microservicios-456909_europe-southwest1_nestjs-microservicios-cluster   gke_nestjs-microservicios-456909_europe-southwest1_nestjs-microservicios-cluster   
          iam-root-account@jobber.eu-north-1.eksctl.io                                       jobber.eu-north-1.eksctl.io                                                        iam-root-account@jobber.eu-north-1.eksctl.io                                       
          minikube                                                                           minikube                                                                           minikube                                                                           default
```

- Si queremos cambiar a `docker-desktop`, ejecutamos el siguiente comando:

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
kubectl config use-context docker-desktop
Switched to context "docker-desktop".
```

- Si queremos cambiar a `gke_nestjs-microservicios-456909_europe-southwest1_nestjs-microservicios-cluster`, ejecutamos el siguiente comando:

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
kubectl config use-context gke_nestjs-microservicios-456909_europe-southwest1_nestjs-microservicios-cluster
Switched to context "gke_nestjs-microservicios-456909_europe-southwest1_nestjs-microservicios-cluster".
```

#### 13.05.07 Crear el `Node Pool`

- Ahora, vamos a crear el `Node Pool`.

![Create Node Pool](nestjs-microservicios.13.011.png)

### 13.06 Configurar GKE

#### 13.06.01 Crear el helm chart en GKE

- Vamos a crear el helm chart en GKE.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$ helm install nestjs-microservicios-gke .
W0419 13:55:16.566580  323692 warnings.go:70] autopilot-default-resources-mutator:Autopilot updated Deployment default/orders-ms: defaulted unspecified 'cpu' resource for containers [orders-ms] (see http://g.co/gke/autopilot-defaults).
W0419 13:55:16.566585  323692 warnings.go:70] autopilot-default-resources-mutator:Autopilot updated Deployment default/payments-ms: defaulted unspecified 'cpu' resource for containers [payments-ms] (see http://g.co/gke/autopilot-defaults).
W0419 13:55:16.568756  323692 warnings.go:70] autopilot-default-resources-mutator:Autopilot updated Deployment default/client-gateway: defaulted unspecified 'cpu' resource for containers [client-gateway] (see http://g.co/gke/autopilot-defaults).
W0419 13:55:16.577322  323692 warnings.go:70] autopilot-default-resources-mutator:Autopilot updated Deployment default/products: defaulted unspecified 'cpu' resource for containers [products-ms] (see http://g.co/gke/autopilot-defaults).
W0419 13:55:16.590499  323692 warnings.go:70] autopilot-default-resources-mutator:Autopilot updated Deployment default/nats-server: defaulted unspecified 'cpu' resource for containers [nats] (see http://g.co/gke/autopilot-defaults).
W0419 13:55:16.667892  323692 warnings.go:70] autopilot-default-resources-mutator:Autopilot updated Deployment default/auth-ms: defaulted unspecified 'cpu' resource for containers [auth-ms] (see http://g.co/gke/autopilot-defaults).
NAME: nestjs-microservicios-gke
LAST DEPLOYED: Sat Apr 19 13:55:15 2025
NAMESPACE: default
STATUS: deployed
REVISION: 1
TEST SUITE: None
```

- Ahora vamos a ver los pods que tenemos en el cluster.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
kubectl get pods
NAME                              READY   STATUS                       RESTARTS   AGE
auth-ms-66dbb6dfd6-2fpd4          0/1     CreateContainerConfigError   0          107s
client-gateway-5597c944fc-phbfh   1/1     Running                      0          107s
nats-server-d689878d8-9jgjc       1/1     Running                      0          108s
orders-ms-65dbbd5dc9-fl9gc        0/1     CreateContainerConfigError   0          108s
payments-ms-9d57dcc87-dmz5m       0/1     CreateContainerConfigError   0          107s
products-6785fbc98c-dw6j7         1/1     Running                      0          108s
```

- Vamos a ver el describe del pod `auth-ms-66dbb6dfd6-2fpd4` para ver el error.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
kubectl describe pod auth-ms-66dbb6dfd6-2fpd4
Name:             auth-ms-66dbb6dfd6-2fpd4
Namespace:        default
Priority:         0
Service Account:  default
Node:             gk3-nestjs-microservicios-clus-pool-2-58a96147-9mh8/10.204.0.6
Start Time:       Sat, 19 Apr 2025 13:56:15 +0200
Labels:           app=auth-ms
                  pod-template-hash=66dbb6dfd6
Annotations:      <none>
Status:           Pending
SeccompProfile:   RuntimeDefault
IP:               10.94.128.66
IPs:
  IP:           10.94.128.66
Controlled By:  ReplicaSet/auth-ms-66dbb6dfd6
Containers:
  auth-ms:
    Container ID:   
    Image:          europe-southwest1-docker.pkg.dev/nestjs-microservicios-456909/nestjs-microservicios/auth-ms:latest
    Image ID:       
    Port:           <none>
    Host Port:      <none>
    State:          Waiting
      Reason:       CreateContainerConfigError
    Ready:          False
    Restart Count:  0
    Limits:
      ephemeral-storage:  1Gi
    Requests:
      cpu:                500m
      ephemeral-storage:  1Gi
      memory:             2Gi
    Environment:
      PORT:               3000
      NATS_SERVERS:       nats://nats-server
      JWT_SECRET:         <set to the key 'JWT_SECRET' in secret 'auth-ms-secrets'>         Optional: false
      AUTH_DATABASE_URL:  <set to the key 'AUTH_DATABASE_URL' in secret 'auth-ms-secrets'>  Optional: false
    Mounts:
      /var/run/secrets/kubernetes.io/serviceaccount from kube-api-access-5m6zp (ro)
Conditions:
  Type                        Status
  PodReadyToStartContainers   True 
  Initialized                 True 
  Ready                       False 
  ContainersReady             False 
  PodScheduled                True 
Volumes:
  kube-api-access-5m6zp:
    Type:                    Projected (a volume that contains injected data from multiple sources)
    TokenExpirationSeconds:  3607
    ConfigMapName:           kube-root-ca.crt
    ConfigMapOptional:       <nil>
    DownwardAPI:             true
QoS Class:                   Burstable
Node-Selectors:              <none>
Tolerations:                 kubernetes.io/arch=amd64:NoSchedule
                             node.kubernetes.io/not-ready:NoExecute op=Exists for 300s
                             node.kubernetes.io/unreachable:NoExecute op=Exists for 300s
Events:
  Type    Reason   Age                    From     Message
  ----    ------   ----                   ----     -------
  Normal  Pulling  113s (x543 over 122m)  kubelet  Pulling image "europe-southwest1-docker.pkg.dev/nestjs-microservicios-456909/nestjs-microservicios/auth-ms:latest"
```

- Vemos el log del pod `auth-ms-66dbb6dfd6-2fpd4` para ver el error.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
kubectl logs auth-ms-66dbb6dfd6-2fpd4
Error from server (BadRequest): container "auth-ms" in pod "auth-ms-66dbb6dfd6-2fpd4" is waiting to start: CreateContainerConfigError
```

- El problema es que los `secrets` no se han configurado en el cluster de GKE.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
kubectl get secrets
NAME                                              TYPE                 DATA   AGE
sh.helm.release.v1.nestjs-microservicios-gke.v1   helm.sh/release.v1   1      131m
```

- Vamos a crear los secrets en el cluster de GKE.
- Tenemos que ejecutar otra vez los comandos de `kubectl create secret` que hicimos en el paso 12.

```bash

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
kubectl create secret docker-registry gcr-json-key --docker-server=europe-southwest1-docker.pkg.dev --docker-username=_json_key --docker-password="$(cat '/home/juanpabloperez/Downloads/nestjs-microservicios-456909-46e7b7a8ab62.json')" --docker-email=juan.xxxx.2025@gmail.com
secret/gcr-json-key created
```

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios/templates/orders-ms$ 
kubectl create secret generic orders-ms-secrets --from-literal=ORDERS_DATABASE_URL="postgresql://neondb_owner:ZZZZZZZZZ@ep-steep-river-a2p3lezj-pooler.eu-central-1.aws.n
eon.tech/orders-db?sslmode=require"
secret/orders-ms-secrets created
```

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios/templates/auth-ms$
kubectl create secret generic auth-ms-secrets --from-literal=JWT_SECRET="CBm2b6nKXXXXXXXYwqDbUmxAJl" --from-literal=AUTH_DATABASE_URL="mongodb+srv://ZZZZZZZZ:YYYYYYYYYYYY@testing.q6ff3cq.mongodb.net/AuthDB"
secret/auth-ms-secrets created
```

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios/templates/payments-ms$
kubectl create secret generic payments-ms-secrets --from-literal=STRIPE_SECRET="sk_test_xxxxx" --from-literal=STRIPE_ENDPOINT_SECRET="whsec_yyyyy"
secret/payments-ms-secrets created
```

- We must ensure the secrets are created in the GKE cluster.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
kubectl get secrets
NAME                                              TYPE                             DATA   AGE
auth-ms-secrets                                   Opaque                           2      2m24s
gcr-json-key                                      kubernetes.io/dockerconfigjson   1      4m19s
orders-ms-secrets                                 Opaque                           1      3m21s
payments-ms-secrets                               Opaque                           2      109s
sh.helm.release.v1.nestjs-microservicios-gke.v1   helm.sh/release.v1               1      159m
```

- Tenemos que asegurarnos de que los pods están funcionando correctamente.

```bash
kubectl get pods
NAME                              READY   STATUS    RESTARTS   AGE
auth-ms-c948c4569-lr2zr           1/1     Running   0          2s
client-gateway-5597c944fc-phbfh   1/1     Running   0          3h25m
nats-server-d689878d8-9jgjc       1/1     Running   0          3h25m
orders-ms-65dbbd5dc9-fl9gc        1/1     Running   0          3h25m
payments-ms-9d57dcc87-dmz5m       1/1     Running   0          3h25m
products-6785fbc98c-dw6j7         1/1     Running   0          3h25m
```

### 13.07 Configurar el Ingress

- Para poder acceder a los microservicios desde fuera del cluster, vamos a configurar el Ingress.
- Lo necesitamos para los microservicios de `client-gateway` y `payments-ms`, este último para poder recibir los webhooks de `Stripe`.

#### 13.07.01 Crear el Ingress para `client-gateway`

- Tenemos que crear un nuevo servicio de tipo `LoadBalancer` para cada uno de los microservicios que necesitan de `Ingress`.

> 02-Products-App/k8s/nestjs-microservicios/templates/ingress/client-gateway.ingress.yaml

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: client-gateway-ingress
spec:
  rules:
    - http:
        paths:
        - path: /*
          pathType: ImplementationSpecific
          backend:
            service:
              name: client-gateway
              port:
                number: 3000
```

#### 13.07.02 Crear el Ingress para `payments-ms`

> 02-Products-App/k8s/nestjs-microservicios/templates/ingress/payments-ms.ingress.yaml

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: payments-ms-ingress
spec:
  rules:
    - http:
        paths:
        - path: /*
          pathType: ImplementationSpecific
          backend:
            service:
              name: payments-ms
              port:
                number: 3000
```

- Ahora, vamos a aplicar los cambios.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
helm upgrade nestjs-microservicios-gke .
Release "nestjs-microservicios-gke" has been upgraded. Happy Helming!
NAME: nestjs-microservicios-gke
LAST DEPLOYED: Sat Apr 19 18:07:45 2025
NAMESPACE: default
STATUS: deployed
REVISION: 2
TEST SUITE: None
```

#### 13.07.03 Verificar que los microservicios están funcionando

- Vamos a la consola de GKE y vamos a ver los ingress que tenemos.

![Ingresses](nestjs-microservicios.13.012.png)

- Accediendo a la URL del Ingress `client-gateway-ingress`, podemos ver que el microservicio `client-gateway` está funcionando.

![Client Gateway Ingress](nestjs-microservicios.13.013.png)

- Accediendo a la URL del Ingress `payments-ms-ingress`, podemos ver que el microservicio `payments-ms` está funcionando.

![Payments MS Ingress](nestjs-microservicios.13.014.png)

#### 13.07.04 Probar si el `client-gateway` está funcionando utilizando el `client-gateway.http` document

- Vamos a probar si el `client-gateway` está funcionando utilizando el `client-gateway.http` document.

> 02-Products-App/client-gateway/src/auth/auth.http

```http
# URL del microservicio de auth-ms desde el Ingress
@url = http://34.8.174.133/api/auth

### Login
# @name login
POST {{url}}/login
Content-Type: application/json

{
  "email": "usuario@gmail.com",
  "password": "1234567!02JSJSJSssswd"
}
```

- Vemos que el login se ha realizado correctamente.

```JSON
HTTP/1.1 201 Created
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 338
ETag: W/"152-3e8GMXDLnmWKtDopvKqdtImnddg"
Date: Sat, 19 Apr 2025 16:27:02 GMT
Via: 1.1 google
Connection: close

{
  "user": {
    "id": "67fd1e8f3e959909a8d14283",
    "email": "usuario@gmail.com",
    "name": "Usuario XXX"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3ZmQxZThmM2U5NTk5MDlhOGQxNDI4MyIsImVtYWlsIjoidXN1YXJpb0BnbWFpbC5jb20iLCJuYW1lIjoiVXN1YXJpbyBYWFgiLCJpYXQiOjE3NDUwODAwMjIsImV4cCI6MTc0NTA4NzIyMn0.PmppJ457_v-Oq3RmD_BtNkQGWR9ZvseOL-vvhBT6Gm0"
}
```

> 02-Products-App/client-gateway/src/products/products.http

```http
# URL del microservicio de products-ms desde el Ingress
@url = http://34.8.174.133/api/products

### Obtener todos los productos
GET {{url}}?page=1&limit=10
```

- Vemos que los productos se han obtenido correctamente.

```JSON
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 1393
ETag: W/"571-7PPTjxFYsXwlEt1GqPWuYpn4J3w"
Date: Sat, 19 Apr 2025 16:29:12 GMT
Via: 1.1 google
Connection: close

{
  "data": [
    {
      "id": 3,
      "name": "Mouse",
      "price": 150,
      "available": true,
      "createdAt": "2024-02-27T15:50:41.977Z",
      "updatedAt": "2024-02-27T15:50:41.977Z"
    },
    {
      "id": 4,
      "name": "Monitor",
      "price": 150,
      "available": true,
      "createdAt": "2024-02-27T15:50:47.955Z",
      "updatedAt": "2024-02-27T15:50:47.955Z"
    },
    .
  ],
  "meta": {
    "total": 47,
    "page": 1,
    "lastPage": 5
  }
}
```

> 02-Products-App/client-gateway/src/orders/orders.http

```http
# URL del servicio de Kubernetes desde el Ingress
@url = http://34.8.174.133/api/orders

### Crear un nuevo pedido
POST {{url}}
Content-Type: application/json

{
  "items": [
    {
      "productId": 3,
      "quantity": 2,
      "price": 150
    },
    {
      "productId": 5,
      "quantity": 1,
      "price": 50
    }    
  ]
}
```

- Vemos que el pedido se ha creado correctamente.

```JSON
HTTP/1.1 201 Created
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 771
ETag: W/"303-a+M2oF5DCKPldIgUzChMmwMqIFI"
Date: Sat, 19 Apr 2025 16:30:39 GMT
Via: 1.1 google
Connection: close

{
  "order": {
    "id": "54648fc4-c12e-415f-a0bd-a9815f5ef2dc",
    "totalAmount": 350,
    "totalItems": 3,
    "status": "PENDING",
    "paid": false,
    "paidAt": null,
    "stripeChargeId": null,
    "createdAt": "2025-04-19T16:30:37.648Z",
    "updatedAt": "2025-04-19T16:30:37.648Z",
    "OrderItem": [
      {
        "price": 150,
        "quantity": 2,
        "productId": 3,
        "name": "Mouse"
      },
      {
        "price": 50,
        "quantity": 1,
        "productId": 5,
        "name": "Audífonos"
      }
    ]
  },
  "paymentSession": {
    "cancelUrl": "http://localhost:3000/payments/cancel",
    "successUrl": "http://localhost:3000/payments/success",
    "url": "https://checkout.stripe.com/c/pay/cs_test_b167c9NRSlsy4rSlwFVa3nH4PJ2pOU9vQJGpWmAEZTQOq3wYGxd9O7Zq40#fidkdWxOYHwnPyd1blpxYHZxWkRPTlx2VkdOVGh%2FZ3NdSjNmMkFMVFdgZDU1SFBuMElvRmYnKSdjd2poVmB3c2B3Jz9xd3BgKSdpZHxqcHFRfHVgJz8naHBpcWxabHFgaCcpJ2BrZGdpYFVpZGZgbWppYWB3dic%2FcXdwYHgl"
  }
}
```

> 02-Products-App/client-gateway/src/health-check/health-check.http

```http
# URL del microservicio de client-gateway desde el Ingress
@url = http://34.8.174.133/

### Comprobar que el healthcheck está funcionando
GET {{url}}
```

- Vemos que el healthcheck está funcionando correctamente.

```JSON
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: text/html; charset=utf-8
Content-Length: 34
ETag: W/"22-4YCOYFdj1PXTn51wWnfhJ7lkvxg"
Date: Sat, 19 Apr 2025 16:33:06 GMT
Via: 1.1 google
Connection: close

Client Gateway is up and running!!
```

#### 13.07.05 Probar si el `payments-ms` está funcionando utilizando el `health-check.http` document

- Vamos a probar si el `payments-ms` está funcionando utilizando el `health-check.http` document.

> 02-Products-App/payments-ms/src/health-check/health-check.http

```http
# URL del servicio de payment-ms desde el Ingress
@url = http://34.49.144.102/

### Comprobar que el healthcheck está funcionando
GET {{url}}
```

- Vemos que el healthcheck está funcionando correctamente.

```JSON
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: text/html; charset=utf-8
Content-Length: 31
ETag: W/"1f-1c8bk3T1EsEX8Iw9uzBYtcJpEa8"
Date: Sat, 19 Apr 2025 16:36:03 GMT
Via: 1.1 google
Connection: close

Payments-ms is up and running!!
```

### 13.08 Obtener costos de los microservicios

- Vamos a obtener los costos de los microservicios.
- Si accedemos a la consola de GKE, Billing, Reports, podemos ver los costos de los microservicios.

![Costos de los microservicios](nestjs-microservicios.13.015.png)

- Se puede ver que para nuestra solución, con 5 microservicios más el nats server y el ingress, el coste es aproximadamente de 10€ al día.
- Solamente se está ejecutando una instancia de cada microservicio, por lo que se ampliaría el coste si se ejecutan más instancias.

### 13.09 Como poner lo Node Pools a Zero para reducir costes al mínimo hasta que se necesiten

- Resize Node Pools to Zero (for Standard Clusters):

  - What it does: If you have a Standard GKE cluster (your screenshot shows "Standard" tier, but "Autopilot" mode - check your cluster mode carefully, as resizing works differently), you can resize its node pools down to zero nodes. This effectively stops all the worker machines associated with the cluster, meaning no Pods can run. The cluster configuration (control plane) remains. If your cluster is Autopilot, it automatically sizes based on workload requests, so you'd achieve a similar effect by deleting all your deployments/pods, though Autopilot pricing differs.
  - Billing Impact: This significantly reduces costs as you stop paying for the worker nodes (which are usually the largest part of the cost). However, for Standard clusters, you will still be charged the hourly fee for the cluster's control plane unless you delete the cluster entirely. Autopilot clusters have different pricing, often including a base fee plus costs per pod resource request, even if scaled down. GKE's free tier might cover the cost of one Zonal or Autopilot cluster's management fee.
  - How: You can edit the node pool(s) in the Google Cloud Console (under the "Nodes" tab for your cluster) and set the size or number of nodes to 0. If cluster autoscaler is enabled, you might need to set both the minimum and maximum nodes to 0 or disable autoscaling first. Via gcloud:

  ```bash
  gcloud container clusters resize nestjs-microservicios-cluster --node-pool POOL_NAME --num-nodes 0 --region europe-southwest1
  ```

  (Replace POOL_NAME with the actual name of your node pool).
  - Considerations: This is a good option if you want to temporarily halt operations and costs (mostly) but intend to restart the cluster later without reconfiguring everything. You can resize back up when needed.

- Resize Node Pools to Zero (for Autopilot Clusters):

  - In Autopilot mode, GKE manages the nodes for you automatically. It provisions and scales the underlying infrastructure based solely on the resource requirements of the workloads (like Pods, Deployments, StatefulSets) you deploy. You don't directly control the node count.
  - What it does: If you have an Autopilot GKE cluster, you can achieve a similar effect by deleting all your deployments/pods. This effectively stops all the worker machines associated with the cluster, meaning no Pods can run. The cluster configuration (control plane) remains.
  - Considerations: This is a good option if you want to temporarily halt operations and costs (mostly) but intend to restart the cluster later without reconfiguring everything. You can resize back up when needed.

#### 13.09.01 Asegurarnos que estamos en el proyecto de configuración de nestjs-microservicios

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
gcloud config configurations activate nestjs-microservicios
Activated [nestjs-microservicios].
```

#### 13.09.02 Borrar todos los pods

- Vemos los pods que tenemos en el proyecto.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
kubectl get pods
NAME                              READY   STATUS    RESTARTS       AGE
auth-ms-c948c4569-lw8bm           1/1     Running   0              4d9h
client-gateway-5597c944fc-k7l56   1/1     Running   0              4d9h
nats-server-d689878d8-cgv87       1/1     Running   0              4d9h
orders-ms-65dbbd5dc9-mrczg        1/1     Running   2 (4d9h ago)   4d9h
payments-ms-9d57dcc87-hdvxr       1/1     Running   0              4d9h
products-6785fbc98c-rdxxc         1/1     Running   2 (4d9h ago)   4d9h
```

- Podemos ver todos los deployments que tenemos en el proyecto.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
kubectl get deployments
NAME             READY   UP-TO-DATE   AVAILABLE   AGE
auth-ms          1/1     1            1           7d5h
client-gateway   1/1     1            1           7d5h
nats-server      1/1     1            1           7d5h
orders-ms        1/1     1            1           7d5h
payments-ms      1/1     1            1           7d5h
products         1/1     1            1           7d5h
```

- Vamos a borrar todos los deployments.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
kubectl delete deployment --all --namespace default
deployment.apps "auth-ms" deleted
deployment.apps "client-gateway" deleted
deployment.apps "nats-server" deleted
deployment.apps "orders-ms" deleted
deployment.apps "payments-ms" deleted
deployment.apps "products" deleted
```

- Vemos que los deployments se han borrado correctamente.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$ kubectl get deployments
No resources found in default namespace.
```

- Eso ha borrado todos los pods también.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
kubectl get pods
No resources found in default namespace.
```

- Vamos a ver si hay algún servicio que esté utilizando los pods.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
kubectl get services
NAME             TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)          AGE
client-gateway   NodePort    34.118.234.239   <none>        3000:30662/TCP   7d5h
kubernetes       ClusterIP   34.118.224.1     <none>        443/TCP          7d6h
nats-server      ClusterIP   34.118.227.64    <none>        4222/TCP         7d5h
payments-ms      NodePort    34.118.230.208   <none>        3000:30596/TCP   7d5h
```

- Vamos a borrar los servicios.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
kubectl delete service client-gateway -n default
service "client-gateway" deleted
kubectl delete service payments-ms -n default
service "payments-ms" deleted
kubectl delete service nats-server -n default
service "nats-server" deleted
```

- Debemos comprobar si tenemos servicios ingress funcionando.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
kubectl get ingress --all-namespaces
NAMESPACE   NAME                     CLASS    HOSTS   ADDRESS         PORTS   AGE
default     client-gateway-ingress   <none>   *       34.8.174.133    80      7d
default     payments-ms-ingress      <none>   *       34.49.144.102   80      7d
```

- Vamos a borrar los servicios ingress.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
kubectl delete ingress client-gateway-ingress -n default
ingress.networking.k8s.io "client-gateway-ingress" deleted
kubectl delete ingress payments-ms-ingress -n default
ingress.networking.k8s.io "payments-ms-ingress" deleted
```

### 13.10 Seleccionar qué contexto usara `kubectl`

- Para poder decidir is kubectl use un contexto local con Docker Desktop o el que tenemos configurado en GCP con GKE tenemos que seleccionar el contexto.
- Podemos ver los contextos que tenemos disponibles con el siguiente comando:

```bash
~/Training/microservices/nestjs-microservicios$
kubectl config get-contexts
CURRENT   NAME                                                                               CLUSTER                                                                            AUTHINFO                                                                           NAMESPACE
          arn:aws:eks:eu-north-1:072929378285:cluster/jobber                                 arn:aws:eks:eu-north-1:072929378285:cluster/jobber                                 arn:aws:eks:eu-north-1:072929378285:cluster/jobber                                 
          docker-desktop                                                                     docker-desktop                                                                     docker-desktop                                                                     
*         gke_nestjs-microservicios-456909_europe-southwest1_nestjs-microservicios-cluster   gke_nestjs-microservicios-456909_europe-southwest1_nestjs-microservicios-cluster   gke_nestjs-microservicios-456909_europe-southwest1_nestjs-microservicios-cluster   
          iam-root-account@jobber.eu-north-1.eksctl.io                                       jobber.eu-north-1.eksctl.io                                                        iam-root-account@jobber.eu-north-1.eksctl.io                                       
          minikube                                                                           minikube 
```

- Es posible que utilizando el siguiente comando se muestre la información mucho más claramente.

```bash
~/Training/microservices/nestjs-microservicios$
kubectl config view
apiVersion: v1
clusters:
- cluster:
    certificate-authority-data: DATA+OMITTED
    server: https://88A5A66176B4BC811F2357B4C1CF0EB2.gr7.eu-north-1.eks.amazonaws.com
  name: arn:aws:eks:eu-north-1:072929378285:cluster/jobber
- cluster:
    certificate-authority-data: DATA+OMITTED
    server: https://kubernetes.docker.internal:6443
  name: docker-desktop
- cluster:
    certificate-authority-data: DATA+OMITTED
    server: https://34.175.218.116
  name: gke_nestjs-microservicios-456909_europe-southwest1_nestjs-microservicios-cluster
- cluster:
    certificate-authority-data: DATA+OMITTED
    server: https://88A5A66176B4BC811F2357B4C1CF0EB2.gr7.eu-north-1.eks.amazonaws.com
  name: jobber.eu-north-1.eksctl.io
- cluster:
    certificate-authority: /home/juanpabloperez/.minikube/ca.crt
    extensions:
    - extension:
        last-update: Sun, 30 Mar 2025 17:06:40 IST
        provider: minikube.sigs.k8s.io
        version: v1.35.0
      name: cluster_info
    server: https://192.168.49.2:8443
  name: minikube
contexts:
- context:
    cluster: arn:aws:eks:eu-north-1:072929378285:cluster/jobber
    user: arn:aws:eks:eu-north-1:072929378285:cluster/jobber
  name: arn:aws:eks:eu-north-1:072929378285:cluster/jobber
- context:
    cluster: docker-desktop
    user: docker-desktop
  name: docker-desktop
- context:
    cluster: gke_nestjs-microservicios-456909_europe-southwest1_nestjs-microservicios-cluster
    user: gke_nestjs-microservicios-456909_europe-southwest1_nestjs-microservicios-cluster
  name: gke_nestjs-microservicios-456909_europe-southwest1_nestjs-microservicios-cluster
- context:
    cluster: jobber.eu-north-1.eksctl.io
    user: iam-root-account@jobber.eu-north-1.eksctl.io
  name: iam-root-account@jobber.eu-north-1.eksctl.io
- context:
    cluster: minikube
    extensions:
    - extension:
        last-update: Sun, 30 Mar 2025 17:06:40 IST
        provider: minikube.sigs.k8s.io
        version: v1.35.0
      name: context_info
    namespace: default
    user: minikube
  name: minikube
current-context: gke_nestjs-microservicios-456909_europe-southwest1_nestjs-microservicios-cluster
kind: Config
preferences: {}
users:
- name: arn:aws:eks:eu-north-1:072929378285:cluster/jobber
  user:
    exec:
      apiVersion: client.authentication.k8s.io/v1beta1
      args:
      - --region
      - eu-north-1
      - eks
      - get-token
      - --cluster-name
      - jobber
      - --output
      - json
      command: aws
      env: null
      interactiveMode: IfAvailable
      provideClusterInfo: false
- name: docker-desktop
  user:
    client-certificate-data: DATA+OMITTED
    client-key-data: DATA+OMITTED
- name: gke_nestjs-microservicios-456909_europe-southwest1_nestjs-microservicios-cluster
  user:
    exec:
      apiVersion: client.authentication.k8s.io/v1beta1
      args: null
      command: gke-gcloud-auth-plugin
      env: null
      installHint: Install gke-gcloud-auth-plugin for use with kubectl by following
        https://cloud.google.com/kubernetes-engine/docs/how-to/cluster-access-for-kubectl#install_plugin
      interactiveMode: IfAvailable
      provideClusterInfo: true
- name: iam-root-account@jobber.eu-north-1.eksctl.io
  user:
    exec:
      apiVersion: client.authentication.k8s.io/v1beta1
      args:
      - eks
      - get-token
      - --output
      - json
      - --cluster-name
      - jobber
      - --region
      - eu-north-1
      command: aws
      env:
      - name: AWS_STS_REGIONAL_ENDPOINTS
        value: regional
      interactiveMode: IfAvailable
      provideClusterInfo: false
- name: minikube
  user:
    client-certificate: /home/juanpabloperez/.minikube/profiles/minikube/client.crt
    client-key: /home/juanpabloperez/.minikube/profiles/minikube/client.key
```

- Podemos ver el contexto actual con el siguiente comando:

```bash
~/Training/microservices/nestjs-microservicios$
kubectl config current-context
gke_nestjs-microservicios-456909_europe-southwest1_nestjs-microservicios-cluster
```

- Podemos seleccionar el contexto con el siguiente comando:

```bash
~/Training/microservices/nestjs-microservicios$
kubectl config use-context docker-desktop
Switched to context "docker-desktop".
```
