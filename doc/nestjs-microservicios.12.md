# NestJS + Microservicios: Aplicaciones escalables y modulares (parte 12)

- En este documento vamos a documentar el curso [NestJS + Microservicios: Aplicaciones escalables y modulares de Udemy](https://www.udemy.com/course/nestjs-microservicios)

## 12 Implementar Kubernetes para desplegar nuestra aplicación en un cluster de Google Kubernetes Engine

### 12.01 Introducción

- Vamos a implementar Kubernetes para desplegar nuestra aplicación en un cluster de Google Kubernetes Engine.
- Es una sección que es agnóstica de la plataforma que usemos, ya sea `AWS`, `GCP`, `Azure`, etc, excepto que usamos las imágenes de Docker ya desplegadas en Google Container Registry.

- Un Cluster de Kubernetes tiene los siguientes componentes esenciales:
  - `Master Node`:
    - Es el nodo maestro del cluster.
    - Controla toda la infraestructura del cluster.
    - Puede tener réplicas de sí mismo para alta disponibilidad.
    - Accedemos a él mediante:
      - CLI (`kubectl` o mediante `gcloud`)
      - API REST
      - Dashboard
  - `API Server`
    - Es el componente que expone la API REST de Kubernetes.
    - Es el encargado de interactuar con el Master Node.
    - Es el encargado de interpretar las acciones que le damos mediante la CLI o el Dashboard.
  - `Controller Manager`
    - Es el componente que se encarga de controlar los nodos del cluster.
    - Es el encargado de interpretar las acciones que le damos mediante la CLI o el Dashboard.
    - Sabe lo que está sucediendo en el cluster y toma decisiones en base a eso.
  - `Scheduler`
    - Es el componente que se encarga de asignar las tareas a los nodos del cluster.
    - Es el encargado de interpretar las acciones que le damos mediante la CLI o el Dashboard.
  - `ETCD`
    - Es el componente que se encarga de almacenar la configuración del cluster.
    - Es el encargado de interpretar las acciones que le damos mediante la CLI o el Dashboard.
    - Se encarga de almacenar la configuración del cluster en forma de `key-value`.
- `Virtual Network`
  - Convierte nuestro cluster en una única máquina.
- `Worker Nodes` que son los nodos que ejecutan las aplicaciones.
  - Cada `Worker Node` tiene:
    - `Kubelet`
      - Es el componente que se encarga de ejecutar las tareas en el nodo.
    - `Kube Proxy`
      - Es el componente que se encarga de exponer los servicios del nodo.
    - `Container Runtime`
      - Es el componente que se encarga de ejecutar las tareas en el nodo.
      - En este caso usamos `containerd` que es un runtime de contenedores.
- `Pods`
  - Son las unidades básicas de código ejecutables en un cluster de Kubernetes.
  - Están compuestos por uno o más contenedores.
  - Todos los `Pods` de un mismo `Node` se ejecutan en el mismo nodo.
  - Los `Pods` son la unidad más pequeña que se puede desplegar en un cluster de Kubernetes.
  - Los `Pods` pueden estar compuestos por un solo contenedor o por múltiples contenedores que se ejecutan juntos.
- `Services`
  - Son los servicios que expone el cluster.
  - Son los servicios que permiten que las aplicaciones se comuniquen entre sí.
  - Los `Services` se encargan de exponer los `Pods` a la red.
  - Los `Services` se encargan de balancear la carga de las solicitudes entre los `Pods`.
  - Los `Services` se encargan de que los `Pods` se puedan comunicar entre sí.
- `Secrets`
  - Contiene por ejemplo las credenciales de las bases de datos.
  - Contiene por ejemplo las credenciales de autenticación de las APIs.

### 12.02 Instalación de `K8s` y `Helm`

#### 12.02.01 Configurar `Docker Desktop` para usar `Kubernetes`

- Tenemos que habilitar el Kubernetes en Docker Desktop.

![Enable Kubernetes](nestjs-microservicios.12.001.png)

- Tarda un poco en activarse.

![Kubernetes enabled](nestjs-microservicios.12.002.png)

- Tenemos que asegurarnos de que el `Kubernetes` está activado.

![Kubernetes enabled](nestjs-microservicios.12.003.png)

#### 12.02.02 Instalación de `kubectl`

- Tenemos que asegurarnos de que tenemos `kubectl` instalado ejecutando el siguiente comando:

```bash
kubectl version
Client Version: v1.32.3
Kustomize Version: v5.5.0
```

#### 12.02.03 Instalación de `Helm`

- Tenemos que asegurarnos de que tenemos `Helm` instalado ejecutando el siguiente comando:

```bash
 helm version
version.BuildInfo{Version:"v3.17.3", GitCommit:"e4da49785aa6e6ee2b86efd5dd9e43400318262b", GitTreeState:"clean", GoVersion:"go1.23.7"}
```

- Si no tenemos `Helm` instalado, lo instalamos según la documentación de [Helm](https://helm.sh) depediendo del sistema operativo que tengamos.

#### 12.02.04 Creación de la carpeta k8s donde vamos a guardar los archivos de configuración de Kubernetes

- Creamos la carpeta `k8s` en el directorio raíz del proyecto.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App$
mkdir k8s
```

- Copiamos el archivo `K8s.README.md` a la carpeta `k8s`.

#### 12.02.05 Creación del proyecto `Helm`

- Creamos el proyecto `Helm` en la carpeta `k8s`.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s$
helm create nestjs-microservicios
Creating nestjs-microservicios
```

- Vamos a ver el contenido del proyecto `Helm`.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s$
cd nestjs-microservicios/
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
ls -la
total 32
drwxr-xr-x 4 juanpabloperez juanpabloperez 4096 Apr 16 17:24 .
drwxrwxr-x 3 juanpabloperez juanpabloperez 4096 Apr 16 17:24 ..
drwxr-xr-x 2 juanpabloperez juanpabloperez 4096 Apr 16 17:24 charts
-rw-r--r-- 1 juanpabloperez juanpabloperez 1157 Apr 16 17:24 Chart.yaml
-rw-r--r-- 1 juanpabloperez juanpabloperez  349 Apr 16 17:24 .helmignore
drwxr-xr-x 3 juanpabloperez juanpabloperez 4096 Apr 16 17:24 templates
-rw-r--r-- 1 juanpabloperez juanpabloperez 4307 Apr 16 17:24 values.yaml
```

- Podemos borrar el contenido del documento `values.yaml` y dejarlo en blanco.
- Podemos borrar todos los archivos de la carpeta `templates` porque vamos a empezar desde cero.

### 12.03 Creación del primer `deployment` para el microservicio de `client-gateway`

- Tenemos que crear la carpeta `client-gateway` en la carpeta `templates`.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
mkdir templates/client-gateway
```

- Vamos a crear el primer `deployment` para nuestro microservicio de `client-gateway`.
  - `client-gateway` es el nombre del microservicio.
  - `europe-southwest1-docker.pkg.dev/nestjs-microservicios-456909/nestjs-microservicios/client-gateway:latest` es la imagen del microservicio.
  - usamos `--dry-run=client` para que no se cree el `deployment` en el cluster.
  - usamos `-o yaml` para que se guarde el resultado en un archivo.
  - `templates/client-gateway/deployment.yaml` es el archivo de configuración del `deployment` para el microservicio `client-gateway` que se creará en el directorio `templates/client-gateway`.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
kubectl create deployment client-gateway --image=europe-southwest1-docker.pkg.dev/nestjs-microservicios-456909/nestjs-microservicios/client-gateway:latest --dry-run=client -o yaml > templates/client-gateway/deployment.yaml
```

- Vamos a ver el contenido del archivo `deployment.yaml`.

> 02-Products-App/k8s/nestjs-microservicios/templates/client-gateway/deployment.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  creationTimestamp: null
  labels:
    app: client-gateway
  name: client-gateway
spec:
  replicas: 1
  selector:
    matchLabels:
      app: client-gateway
  strategy: {}
  template:
    metadata:
      creationTimestamp: null
      labels:
        app: client-gateway
    spec:
      containers:
      - image: europe-southwest1-docker.pkg.dev/nestjs-microservicios-456909/nestjs-microservicios/client-gateway:latest
        name: client-gateway
        resources: {}
status: {}
```

- Si hemos estado trabajando con otro proyecto con Helm, es posible que esté apuntando a otro cluster.
- Para trabajar con el cluster de Docker Desktop, tenemos que hacer lo siguiente:

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
kubectl config use-context docker-desktop
Switched to context "docker-desktop".
```

- Vamos a ejecutar el comando `helm install` para instalar el `deployment` en el cluster.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
helm install nestjs-microservicios .
NAME: nestjs-microservicios
LAST DEPLOYED: Wed Apr 16 18:00:10 2025
NAMESPACE: default
STATUS: deployed
REVISION: 1
TEST SUITE: None
```

- Vamos a crear el `deployment` en el cluster.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
helm upgrade nestjs-microservicios .
Release "nestjs-microservicios" has been upgraded. Happy Helming!
NAME: nestjs-microservicios
LAST DEPLOYED: Wed Apr 16 18:01:06 2025
NAMESPACE: default
STATUS: deployed
REVISION: 2
TEST SUITE: None
```

- Vamos a ver el estado de los `pods` en el cluster.

```bash
kubectl get pods
NAME                              READY   STATUS             RESTARTS   AGE
client-gateway-7f9f5f5fff-plhb8   0/1     ImagePullBackOff   0          5m32s
```

- Vamos a ver los logs del `pod`.

```bash
kubectl logs client-gateway-7f9f5f5fff-plhb8
Error from server (BadRequest): container "client-gateway" in pod "client-gateway-7f9f5f5fff-plhb8" is waiting to start: trying and failing to pull image
```

- Tambien podemos ver los logs del `pod` utilizando `describe`.

```bash
kubectl describe pod client-gateway-7f9f5f5fff-plhb8
Name:             client-gateway-7f9f5f5fff-plhb8
Namespace:        default
Priority:         0
Service Account:  default
Node:             docker-desktop/192.168.65.9
Start Time:       Wed, 16 Apr 2025 18:00:10 +0200
Labels:           app=client-gateway
                  pod-template-hash=7f9f5f5fff
Annotations:      <none>
Status:           Pending
IP:               10.1.0.6
IPs:
  IP:           10.1.0.6
Controlled By:  ReplicaSet/client-gateway-7f9f5f5fff
Containers:
  client-gateway:
    Container ID:   
    Image:          europe-southwest1-docker.pkg.dev/nestjs-microservicios-456909/nestjs-microservicios/client-gateway:latest
    Image ID:       
    Port:           <none>
    Host Port:      <none>
    State:          Waiting
      Reason:       ImagePullBackOff
    Ready:          False
    Restart Count:  0
    Environment:    <none>
    Mounts:
      /var/run/secrets/kubernetes.io/serviceaccount from kube-api-access-n4q4l (ro)
Conditions:
  Type                        Status
  PodReadyToStartContainers   True 
  Initialized                 True 
  Ready                       False 
  ContainersReady             False 
  PodScheduled                True 
Volumes:
  kube-api-access-n4q4l:
    Type:                    Projected (a volume that contains injected data from multiple sources)
    TokenExpirationSeconds:  3607
    ConfigMapName:           kube-root-ca.crt
    ConfigMapOptional:       <nil>
    DownwardAPI:             true
QoS Class:                   BestEffort
Node-Selectors:              <none>
Tolerations:                 node.kubernetes.io/not-ready:NoExecute op=Exists for 300s
                             node.kubernetes.io/unreachable:NoExecute op=Exists for 300s
Events:
  Type     Reason     Age                     From               Message
  ----     ------     ----                    ----               -------
  Normal   Scheduled  8m29s                   default-scheduler  Successfully assigned default/client-gateway-7f9f5f5fff-plhb8 to docker-desktop
  Normal   Pulling    5m46s (x5 over 8m28s)   kubelet            Pulling image "europe-southwest1-docker.pkg.dev/nestjs-microservicios-456909/nestjs-microservicios/client-gateway:latest"
  Warning  Failed     5m45s (x5 over 8m27s)   kubelet            Failed to pull image "europe-southwest1-docker.pkg.dev/nestjs-microservicios-456909/nestjs-microservicios/client-gateway:latest": Error response from daemon: Head "https://europe-southwest1-docker.pkg.dev/v2/nestjs-microservicios-456909/nestjs-microservicios/client-gateway/manifests/latest": denied: Unauthenticated request. Unauthenticated requests do not have permission "artifactregistry.repositories.downloadArtifacts" on resource "projects/nestjs-microservicios-456909/locations/europe-southwest1/repositories/nestjs-microservicios" (or it may not exist)
  Warning  Failed     5m45s (x5 over 8m27s)   kubelet            Error: ErrImagePull
  Warning  Failed     3m23s (x20 over 8m27s)  kubelet            Error: ImagePullBackOff
  Normal   BackOff    3m8s (x21 over 8m27s)   kubelet            Back-off pulling image "europe-southwest1-docker.pkg.dev/nestjs-microservicios-456909/nestjs-microservicios/client-gateway:latest"
```

- Vemos que no se ha podido descargar la imagen del microservicio porque no tenemos credenciales para acceder al registro de contenedores de Google Container Registry.

### 12.04 Configuración de las credenciales de Google Container Registry

- Vamos a configurar las credenciales de Google Container Registry.
- Desde Google Cloud Console, vamos a la sección `IAM & Services`.

![IAM & Services](nestjs-microservicios.12.004.png)

- Tenemos que crear una nueva cuenta de servicio.

![Create Service Account](nestjs-microservicios.12.005.png)

- Le damos un nombre a la cuenta de servicio, por ejemplo `k8s-nestjs-microservicios`.

![Service Account Name](nestjs-microservicios.12.006.png)

- Tenemos que darle permisos para que pueda acceder al registro de contenedores de Google Container Registry, es decir, `Artifact Registry Reader`.

![Service Account Permissions](nestjs-microservicios.12.007.png)

- No tenemos que asignar `Grant users access to this service account` porque no queremos que se pueda acceder a la cuenta de servicio desde fuera del cluster.

![Done](nestjs-microservicios.12.008.png)

- Tenemos que asegurarnos de que la cuenta de servicio está creada.

![Service Account Created](nestjs-microservicios.12.009.png)

- Tenemos que crear una nueva clave privada para la cuenta de servicio.

![Create Key](nestjs-microservicios.12.010.png)

- Utilizamos el formato `JSON` que se descarga automáticamente a nuestro ordenador.

![JSON Key](nestjs-microservicios.12.011.png)

![Download Key](nestjs-microservicios.12.012.png)

- Tenemos que crearnos un secreto `docker-registry` de Kubernetes, al que vamos a llamar `gcr-json-key`, con la clave privada.
- El `docker-server` es el servidor de Docker, en este caso `europe-southwest1-docker.pkg.dev`.
- El `docker-username` es el nombre de la cuenta de servicio, en este caso `_json_key`.
- El `docker-password` es el contenido del archivo `key.json` que hemos descargado en el paso anterior.
- El `docker-email` es el email de la cuenta de servicio, en este caso `juan.xxxx.2025@gmail.com`.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
kubectl create secret docker-registry gcr-json-key --docker-server=europe-southwest1-docker.pkg.dev --docker-username=_json_key --docker-password="$(cat '/home/juanpabloperez/Downloads/nestjs-microservicios-456909-46e7b7a8ab62.json')" --docker-email=juan.xxxx.2025@gmail.com
secret/gcr-json-key created
```

- Tenemos que utilizar `kubectl patch` para añadir el secreto al service account `default`.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
 kubectl patch serviceaccount default --patch '{"imagePullSecrets":[{"name":"gcr-json-key"}]}'
serviceaccount/default patched
```

- Tenemos que hacer un `rollout` para que se apliquen los cambios.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
kubectl rollout restart deployment
deployment.apps/client-gateway restarted
```

- Tenemos que ver el estado de los `pods` en el cluster.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
kubectl get pods
NAME                              READY   STATUS             RESTARTS      AGE
client-gateway-58b8d577f5-ptg2p   0/1     CrashLoopBackOff   2 (24s ago)   53s
```

- Vamos a ver los logs del `pod`.

```bash
kubectl describe pod client-gateway-58b8d577f5-ptg2p
Name:             client-gateway-58b8d577f5-ptg2p
Namespace:        default
Priority:         0
Service Account:  default
Node:             docker-desktop/192.168.65.9
Start Time:       Wed, 16 Apr 2025 19:05:09 +0200
Labels:           app=client-gateway
                  pod-template-hash=58b8d577f5
Annotations:      kubectl.kubernetes.io/restartedAt: 2025-04-16T19:05:09+02:00
Status:           Running
IP:               10.1.0.7
IPs:
  IP:           10.1.0.7
Controlled By:  ReplicaSet/client-gateway-58b8d577f5
Containers:
  client-gateway:
    Container ID:   docker://0db199886ae9c72e4099694eb07e189ce32b190169ed332e0d7f52fd95b57d5b
    Image:          europe-southwest1-docker.pkg.dev/nestjs-microservicios-456909/nestjs-microservicios/client-gateway:latest
    Image ID:       docker-pullable://europe-southwest1-docker.pkg.dev/nestjs-microservicios-456909/nestjs-microservicios/client-gateway@sha256:53db3955b89cb4de61f5a5fff0a1a4a67496ad074035291437e2c01850383e4c
    Port:           <none>
    Host Port:      <none>
    State:          Terminated
      Reason:       Error
      Exit Code:    1
      Started:      Wed, 16 Apr 2025 19:06:59 +0200
      Finished:     Wed, 16 Apr 2025 19:07:00 +0200
    Last State:     Terminated
      Reason:       Error
      Exit Code:    1
      Started:      Wed, 16 Apr 2025 19:06:06 +0200
      Finished:     Wed, 16 Apr 2025 19:06:07 +0200
    Ready:          False
    Restart Count:  4
    Environment:    <none>
    Mounts:
      /var/run/secrets/kubernetes.io/serviceaccount from kube-api-access-4sbgj (ro)
Conditions:
  Type                        Status
  PodReadyToStartContainers   True 
  Initialized                 True 
  Ready                       False 
  ContainersReady             False 
  PodScheduled                True 
Volumes:
  kube-api-access-4sbgj:
    Type:                    Projected (a volume that contains injected data from multiple sources)
    TokenExpirationSeconds:  3607
    ConfigMapName:           kube-root-ca.crt
    ConfigMapOptional:       <nil>
    DownwardAPI:             true
QoS Class:                   BestEffort
Node-Selectors:              <none>
Tolerations:                 node.kubernetes.io/not-ready:NoExecute op=Exists for 300s
                             node.kubernetes.io/unreachable:NoExecute op=Exists for 300s
Events:
  Type     Reason     Age                 From               Message
  ----     ------     ----                ----               -------
  Normal   Scheduled  2m4s                default-scheduler  Successfully assigned default/client-gateway-58b8d577f5-ptg2p to docker-desktop
  Normal   Pulled     118s                kubelet            Successfully pulled image "europe-southwest1-docker.pkg.dev/nestjs-microservicios-456909/nestjs-microservicios/client-gateway:latest" in 5.089s (5.089s including waiting). Image size: 185344836 bytes.
  Normal   Pulled     115s                kubelet            Successfully pulled image "europe-southwest1-docker.pkg.dev/nestjs-microservicios-456909/nestjs-microservicios/client-gateway:latest" in 1.048s (1.048s including waiting). Image size: 185344836 bytes.
  Normal   Pulled     96s                 kubelet            Successfully pulled image "europe-southwest1-docker.pkg.dev/nestjs-microservicios-456909/nestjs-microservicios/client-gateway:latest" in 918ms (918ms including waiting). Image size: 185344836 bytes.
  Normal   Pulled     67s                 kubelet            Successfully pulled image "europe-southwest1-docker.pkg.dev/nestjs-microservicios-456909/nestjs-microservicios/client-gateway:latest" in 890ms (890ms including waiting). Image size: 185344836 bytes.
  Normal   Pulling    16s (x5 over 2m3s)  kubelet            Pulling image "europe-southwest1-docker.pkg.dev/nestjs-microservicios-456909/nestjs-microservicios/client-gateway:latest"
  Normal   Created    15s (x5 over 118s)  kubelet            Created container: client-gateway
  Normal   Pulled     15s                 kubelet            Successfully pulled image "europe-southwest1-docker.pkg.dev/nestjs-microservicios-456909/nestjs-microservicios/client-gateway:latest" in 949ms (949ms including waiting). Image size: 185344836 bytes.
  Normal   Started    14s (x5 over 118s)  kubelet            Started container client-gateway
  Warning  BackOff    12s (x9 over 113s)  kubelet            Back-off restarting failed container client-gateway in pod client-gateway-58b8d577f5-ptg2p_default(95ce859f-2986-4bc3-af74-1d3fdb9144eb)
```

- Vemos que la imagen se descargó correctamente, pero el contenedor no se ha podido iniciar.
- Vamos a ver los logs del pod.

```bash
kubectl logs client-gateway-58b8d577f5-ptg2p
/usr/src/app/dist/config/envs.js:17
    throw new Error(`Config validation error: ${error.message}`);
    ^

Error: Config validation error: "PORT" is required
    at Object.<anonymous> (/usr/src/app/dist/config/envs.js:17:11)
    at Module._compile (node:internal/modules/cjs/loader:1554:14)
    at Object..js (node:internal/modules/cjs/loader:1706:10)
    at Module.load (node:internal/modules/cjs/loader:1289:32)
    at Function._load (node:internal/modules/cjs/loader:1108:12)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:220:24)
    at Module.require (node:internal/modules/cjs/loader:1311:12)
    at require (node:internal/modules/helpers:136:16)
    at Object.<anonymous> (/usr/src/app/dist/config/index.js:17:14)

Node.js v22.14.0
```

- Vemos que el error es que no se ha podido iniciar el contenedor porque no se ha podido cargar la variable de entorno `PORT`.

### 12.05 Configuración de las variables de entorno

- Tenemos que modificar el archivo `/templates/client-gateway/deployment.yaml` para añadir las variables de entorno.

> 02-Products-App/k8s/nestjs-microservicios/templates/client-gateway/deployment.yaml

```diff
.
  spec:
    containers:
    - image: europe-southwest1-docker.pkg.dev/nestjs-microservicios-456909/nestjs-microservicios/client-gateway:latest
      name: client-gateway
      resources: {}
+     env:
+       - name: PORT
+       value: "3000"
status: {}
```

- Vamos a hacer un `upgrade` para que se apliquen los cambios.

```bash
helm upgrade nestjs-microservicios .
Release "nestjs-microservicios" has been upgraded. Happy Helming!
NAME: nestjs-microservicios
LAST DEPLOYED: Wed Apr 16 19:14:43 2025
NAMESPACE: default
STATUS: deployed
REVISION: 3
TEST SUITE: None
```

- Vamos a ver el estado de los `pods` en el cluster.

```bash
kubectl get pods
NAME                             READY   STATUS   RESTARTS      AGE
client-gateway-b7f5bcc45-bj527   0/1     Error    2 (17s ago)   22s
```

- Vamos a ver los logs del `pod`.

```bash
kubectl logs client-gateway-b7f5bcc45-bj527
/usr/src/app/dist/config/envs.js:17
    throw new Error(`Config validation error: ${error.message}`);
    ^

Error: Config validation error: "NATS_SERVERS" is required
    at Object.<anonymous> (/usr/src/app/dist/config/envs.js:17:11)
    at Module._compile (node:internal/modules/cjs/loader:1554:14)
    at Object..js (node:internal/modules/cjs/loader:1706:10)
    at Module.load (node:internal/modules/cjs/loader:1289:32)
    at Function._load (node:internal/modules/cjs/loader:1108:12)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:220:24)
    at Module.require (node:internal/modules/cjs/loader:1311:12)
    at require (node:internal/modules/helpers:136:16)
    at Object.<anonymous> (/usr/src/app/dist/config/index.js:17:14)

Node.js v22.14.0
```

- Vemos que el error es que no se ha podido iniciar el contenedor porque no se ha podido cargar la variable de entorno `NATS_SERVERS`.
- Tenemos que modificar el archivo `/templates/client-gateway/deployment.yaml` para añadir la variable de entorno `NATS_SERVERS`.

> 02-Products-App/k8s/nestjs-microservicios/templates/client-gateway/deployment.yaml

```diff
.
  spec:
    containers:
      - image: europe-southwest1-docker.pkg.dev/nestjs-microservicios-456909/nestjs-microservicios/client-gateway:latest
        name: client-gateway
        resources: {}
        env:
          - name: PORT
            value: "3000"
+         - name: NATS_SERVERS
+           value: "nats://nats-server:6222"
status: {}
```

- Vamos a hacer un `upgrade` para que se apliquen los cambios.

```bash
helm upgrade nestjs-microservicios .
Release "nestjs-microservicios" has been upgraded. Happy Helming!
NAME: nestjs-microservicios
LAST DEPLOYED: Wed Apr 16 19:21:22 2025
NAMESPACE: default
STATUS: deployed
REVISION: 5
TEST SUITE: None
```

- Vamos a ver el estado de los `pods` en el cluster.

```bash
kubectl get pods
NAME                             READY   STATUS    RESTARTS   AGE
client-gateway-646498669-rnvcl   1/1     Running   0          21s
```

- Vamos a ver los logs del `pod`.

```bash
kubectl logs client-gateway-646498669-rnvcl
[Nest] 1  - 04/16/2025, 5:21:24 PM     LOG [NestFactory] Starting Nest application...
[Nest] 1  - 04/16/2025, 5:21:24 PM     LOG [InstanceLoader] AppModule dependencies initialized +12ms
[Nest] 1  - 04/16/2025, 5:21:24 PM     LOG [InstanceLoader] NatsModule dependencies initialized +0ms
[Nest] 1  - 04/16/2025, 5:21:24 PM     LOG [InstanceLoader] ClientsModule dependencies initialized +0ms
[Nest] 1  - 04/16/2025, 5:21:24 PM     LOG [InstanceLoader] ProductsModule dependencies initialized +1ms
[Nest] 1  - 04/16/2025, 5:21:24 PM     LOG [InstanceLoader] OrdersModule dependencies initialized +0ms
[Nest] 1  - 04/16/2025, 5:21:24 PM     LOG [InstanceLoader] AuthModule dependencies initialized +0ms
[Nest] 1  - 04/16/2025, 5:21:24 PM     LOG [RoutesResolver] ProductsController {/api/products}: +6ms
[Nest] 1  - 04/16/2025, 5:21:24 PM     LOG [RouterExplorer] Mapped {/api/products, POST} route +3ms
[Nest] 1  - 04/16/2025, 5:21:24 PM     LOG [RouterExplorer] Mapped {/api/products, GET} route +1ms
[Nest] 1  - 04/16/2025, 5:21:24 PM     LOG [RouterExplorer] Mapped {/api/products/:id, GET} route +2ms
[Nest] 1  - 04/16/2025, 5:21:24 PM     LOG [RouterExplorer] Mapped {/api/products/:id, DELETE} route +0ms
[Nest] 1  - 04/16/2025, 5:21:24 PM     LOG [RouterExplorer] Mapped {/api/products/:id, PATCH} route +1ms
[Nest] 1  - 04/16/2025, 5:21:24 PM     LOG [RoutesResolver] OrdersController {/api/orders}: +0ms
[Nest] 1  - 04/16/2025, 5:21:24 PM     LOG [RouterExplorer] Mapped {/api/orders, POST} route +0ms
[Nest] 1  - 04/16/2025, 5:21:24 PM     LOG [RouterExplorer] Mapped {/api/orders, GET} route +1ms
[Nest] 1  - 04/16/2025, 5:21:24 PM     LOG [RouterExplorer] Mapped {/api/orders/:status, GET} route +0ms
[Nest] 1  - 04/16/2025, 5:21:24 PM     LOG [RouterExplorer] Mapped {/api/orders/id/:id, GET} route +1ms
[Nest] 1  - 04/16/2025, 5:21:24 PM     LOG [RouterExplorer] Mapped {/api/orders/:id, PATCH} route +1ms
[Nest] 1  - 04/16/2025, 5:21:24 PM     LOG [RoutesResolver] AuthController {/api/auth}: +0ms
[Nest] 1  - 04/16/2025, 5:21:24 PM     LOG [RouterExplorer] Mapped {/api/auth/register, POST} route +0ms
[Nest] 1  - 04/16/2025, 5:21:24 PM     LOG [RouterExplorer] Mapped {/api/auth/login, POST} route +0ms
[Nest] 1  - 04/16/2025, 5:21:24 PM     LOG [RouterExplorer] Mapped {/api/auth/verify, GET} route +1ms
[Nest] 1  - 04/16/2025, 5:21:24 PM     LOG [NestApplication] Nest application successfully started +3ms
[Nest] 1  - 04/16/2025, 5:21:24 PM     LOG [Main-Gateway] Gateway running on port 3000
```

### 12.06 Crear un servicio de Kubernetes para el microservicio de Client Gateway para que se pueda acceder a él desde fuera del cluster

- Vamos a crear un servicio de Kubernetes para el microservicio de Client Gateway para que se pueda acceder a él desde fuera del cluster.
- Vamos a crear un archivo `service.yaml` en el directorio `02-Products-App/k8s/nestjs-microservicios/templates/client-gateway`.
- Vamos a utilizar `kubectl create service` para crear el servicio.

```bash
~/Training/microservices/nestjs-microservicios$
cd 02-Products-App/k8s/nestjs-microservicios/templates/client-gateway
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios/templates/client-gateway$ 
kubectl create service nodeport client-gateway --tcp=3000 --dry-run=client -o yaml > service.yaml
```

- Vemos que el servicio se ha creado correctamente.

> 02-Products-App/k8s/nestjs-microservicios/templates/client-gateway/service.yaml

```yaml
apiVersion: v1
kind: Service
metadata:
  creationTimestamp: null
  labels:
    app: client-gateway
  name: client-gateway
spec:
  ports:
  - name: "3000"
    port: 3000
    protocol: TCP
    targetPort: 3000
  selector:
    app: client-gateway
  type: NodePort
status:
  loadBalancer: {}
```

- Vamos a aplicar el servicio al cluster usando `helm upgrade`.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
helm upgrade nestjs-microservicios .
Release "nestjs-microservicios" has been upgraded. Happy Helming!
NAME: nestjs-microservicios
LAST DEPLOYED: Thu Apr 17 13:12:49 2025
NAMESPACE: default
STATUS: deployed
REVISION: 6
TEST SUITE: None
```

- Vamos a ver el estado de los pods en el cluster.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
kubectl get pods
NAME                             READY   STATUS    RESTARTS        AGE
client-gateway-646498669-rnvcl   1/1     Running   1 (7h56m ago)   17h
```

- Vamos a ver el estado de los servicios en el cluster.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
kubectl get services
NAME             TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
client-gateway   NodePort    10.107.98.249   <none>        3000:30940/TCP   34s
kubernetes       ClusterIP   10.96.0.1       <none>        443/TCP          20h
```

- Cambiamos el documento `02-Products-App/client-gateway/src/products/products.http` para que use el servicio de Kubernetes. Y ejecutamos uno de los endpoints.

> 02-Products-App/client-gateway/src/products/products.http

```diff
.
# URL del servicio de Kubernetes
@url = http://localhost:30940/api/products

### Obtener todos los productos
GET {{url}}?page=1&limit=10

```

- Vemos la respuesta del endpoint.

```JSON
HTTP/1.1 500 Internal Server Error
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 52
ETag: W/"34-rlKccw1E+/fV8niQk4oFitDfPro"
Date: Thu, 17 Apr 2025 11:19:03 GMT
Connection: close

{
  "statusCode": 500,
  "message": "Internal server error"
}
```

- Vemos que tenemos un error de servidor interno, pero controlado por el microservicio.
- Vamos a ver los logs del pod.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
kubectl logs client-gateway-646498669-rnvcl 
[Nest] 1  - 04/17/2025, 3:18:07 AM     LOG [NestFactory] Starting Nest application...
[Nest] 1  - 04/17/2025, 3:18:07 AM     LOG [InstanceLoader] AppModule dependencies initialized +11ms
[Nest] 1  - 04/17/2025, 3:18:07 AM     LOG [InstanceLoader] NatsModule dependencies initialized +0ms
[Nest] 1  - 04/17/2025, 3:18:07 AM     LOG [InstanceLoader] ClientsModule dependencies initialized +0ms
[Nest] 1  - 04/17/2025, 3:18:07 AM     LOG [InstanceLoader] ProductsModule dependencies initialized +1ms
[Nest] 1  - 04/17/2025, 3:18:07 AM     LOG [InstanceLoader] OrdersModule dependencies initialized +0ms
[Nest] 1  - 04/17/2025, 3:18:07 AM     LOG [InstanceLoader] AuthModule dependencies initialized +0ms
[Nest] 1  - 04/17/2025, 3:18:07 AM     LOG [RoutesResolver] ProductsController {/api/products}: +6ms
[Nest] 1  - 04/17/2025, 3:18:07 AM     LOG [RouterExplorer] Mapped {/api/products, POST} route +3ms
[Nest] 1  - 04/17/2025, 3:18:07 AM     LOG [RouterExplorer] Mapped {/api/products, GET} route +1ms
[Nest] 1  - 04/17/2025, 3:18:07 AM     LOG [RouterExplorer] Mapped {/api/products/:id, GET} route +1ms
[Nest] 1  - 04/17/2025, 3:18:07 AM     LOG [RouterExplorer] Mapped {/api/products/:id, DELETE} route +0ms
[Nest] 1  - 04/17/2025, 3:18:07 AM     LOG [RouterExplorer] Mapped {/api/products/:id, PATCH} route +1ms
[Nest] 1  - 04/17/2025, 3:18:07 AM     LOG [RoutesResolver] OrdersController {/api/orders}: +0ms
[Nest] 1  - 04/17/2025, 3:18:07 AM     LOG [RouterExplorer] Mapped {/api/orders, POST} route +0ms
[Nest] 1  - 04/17/2025, 3:18:07 AM     LOG [RouterExplorer] Mapped {/api/orders, GET} route +1ms
[Nest] 1  - 04/17/2025, 3:18:07 AM     LOG [RouterExplorer] Mapped {/api/orders/:status, GET} route +0ms
[Nest] 1  - 04/17/2025, 3:18:07 AM     LOG [RouterExplorer] Mapped {/api/orders/id/:id, GET} route +1ms
[Nest] 1  - 04/17/2025, 3:18:07 AM     LOG [RouterExplorer] Mapped {/api/orders/:id, PATCH} route +0ms
[Nest] 1  - 04/17/2025, 3:18:07 AM     LOG [RoutesResolver] AuthController {/api/auth}: +0ms
[Nest] 1  - 04/17/2025, 3:18:07 AM     LOG [RouterExplorer] Mapped {/api/auth/register, POST} route +0ms
[Nest] 1  - 04/17/2025, 3:18:07 AM     LOG [RouterExplorer] Mapped {/api/auth/login, POST} route +1ms
[Nest] 1  - 04/17/2025, 3:18:07 AM     LOG [RouterExplorer] Mapped {/api/auth/verify, GET} route +0ms
[Nest] 1  - 04/17/2025, 3:18:07 AM     LOG [NestApplication] Nest application successfully started +2ms
[Nest] 1  - 04/17/2025, 3:18:07 AM     LOG [Main-Gateway] Gateway running on port 3000
[Nest] 1  - 04/17/2025, 11:19:03 AM   ERROR [ExceptionsHandler] Error: getaddrinfo ENOTFOUND nats-server
    at GetAddrInfoReqWrap.onlookupall [as oncomplete] (node:dns:120:26) {
  errno: -3008,
  code: 'ENOTFOUND',
  syscall: 'getaddrinfo',
  hostname: 'nats-server'
}
```

- Vemos que el error es que no se ha podido encontrar el servicio de `NATS`.
- El motivo es que no tenemos el microservicio de `NATS` instalado y configurado para el helm chart

### 12.07 Instalar el microservicio de NATS

- Vamos a instalar el microservicio de NATS creando un deployment.yaml en el directorio `02-Products-App/k8s/nestjs-microservicios/templates/nats` usando `kubectl create deployment` y un servicio usando `kubectl create service clusterip`.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios/templates$
mkdir nats
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios/templates$
cd nats
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios/templates/nats$
kubectl create deployment nats-server --image=nats:latest --dry-run=client -o yaml > deployment.yaml
```

- Podemos ver el archivo `deployment.yaml` creado.

> 02-Products-App/k8s/nestjs-microservicios/templates/nats/deployment.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  creationTimestamp: null
  labels:
    app: nats-server
  name: nats-server
spec:
  replicas: 1
  selector:
    matchLabels:
      app: nats-server
  strategy: {}
  template:
    metadata:
      creationTimestamp: null
      labels:
        app: nats-server
    spec:
      containers:
      - image: nats:latest
        name: nats
        resources: {}
status: {}
```

- Vamos a desplegar el microservicio de NATS en el cluster usando `helm upgrade`.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
helm upgrade nestjs-microservicios .
Release "nestjs-microservicios" has been upgraded. Happy Helming!
NAME: nestjs-microservicios
LAST DEPLOYED: Thu Apr 17 14:37:26 2025
NAMESPACE: default
STATUS: deployed
REVISION: 7
TEST SUITE: None
```

- Vamos a ver el estado de los pods en el cluster.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
kubectl get pods
NAME                             READY   STATUS    RESTARTS     AGE
client-gateway-646498669-rnvcl   1/1     Running   1 (9h ago)   19h
nats-server-86f8857d9d-rqhfm     1/1     Running   0            40s
```

- Vamos a crear un servicio para el microservicio de NATS usando `kubectl create service clusterip`.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios/templates/nats$
kubectl create service clusterip nats-server --tcp=4222 --dry-run=client -o yaml > service.yaml
```

- Podemos ver el archivo `service.yaml` creado.

> 02-Products-App/k8s/nestjs-microservicios/templates/nats/service.yaml

```yamlapiVersion: v1
kind: Service
metadata:
  creationTimestamp: null
  labels:
    app: nats-server
  name: nats-server
spec:
  ports:
  - name: "4222"
    port: 4222
    protocol: TCP
    targetPort: 4222
  selector:
    app: nats-server
  type: ClusterIP
status:
  loadBalancer: {}
```

- Vamos a aplicar el servicio al cluster usando `helm upgrade`.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
helm upgrade nestjs-microservicios .
Release "nestjs-microservicios" has been upgraded. Happy Helming!
NAME: nestjs-microservicios
LAST DEPLOYED: Thu Apr 17 14:42:56 2025
NAMESPACE: default
STATUS: deployed
REVISION: 8
TEST SUITE: None
```

- Vamos a ver el estado de los servicios en el cluster.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
kubectl get services
NAME             TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
client-gateway   NodePort    10.107.98.249   <none>        3000:30940/TCP   90m
kubernetes       ClusterIP   10.96.0.1       <none>        443/TCP          21h
nats-server      ClusterIP   10.108.36.158   <none>        4222/TCP         26s
```

- Ejecutando el documento `02-Products-App/client-gateway/src/products/products.http` vemos que el microservicio de NATS no está funcionando, con el mismo error que antes.

```JSON
HTTP/1.1 500 Internal Server Error
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 52
ETag: W/"34-rlKccw1E+/fV8niQk4oFitDfPro"
Date: Thu, 17 Apr 2025 12:44:47 GMT
Connection: close

{
  "statusCode": 500,
  "message": "Internal server error"
}
```

- Vamos a ver los logs del microservicio de NATS.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
kubectl logs client-gateway-646498669-rnvcl 
[Nest] 1  - 04/17/2025, 3:18:07 AM     LOG [NestFactory] Starting Nest application...
[Nest] 1  - 04/17/2025, 3:18:07 AM     LOG [InstanceLoader] AppModule dependencies initialized +11ms
[Nest] 1  - 04/17/2025, 3:18:07 AM     LOG [InstanceLoader] NatsModule dependencies initialized +0ms
[Nest] 1  - 04/17/2025, 3:18:07 AM     LOG [InstanceLoader] ClientsModule dependencies initialized +0ms
[Nest] 1  - 04/17/2025, 3:18:07 AM     LOG [InstanceLoader] ProductsModule dependencies initialized +1ms
[Nest] 1  - 04/17/2025, 3:18:07 AM     LOG [InstanceLoader] OrdersModule dependencies initialized +0ms
[Nest] 1  - 04/17/2025, 3:18:07 AM     LOG [InstanceLoader] AuthModule dependencies initialized +0ms
[Nest] 1  - 04/17/2025, 3:18:07 AM     LOG [RoutesResolver] ProductsController {/api/products}: +6ms
[Nest] 1  - 04/17/2025, 3:18:07 AM     LOG [RouterExplorer] Mapped {/api/products, POST} route +3ms
[Nest] 1  - 04/17/2025, 3:18:07 AM     LOG [RouterExplorer] Mapped {/api/products, GET} route +1ms
[Nest] 1  - 04/17/2025, 3:18:07 AM     LOG [RouterExplorer] Mapped {/api/products/:id, GET} route +1ms
[Nest] 1  - 04/17/2025, 3:18:07 AM     LOG [RouterExplorer] Mapped {/api/products/:id, DELETE} route +0ms
[Nest] 1  - 04/17/2025, 3:18:07 AM     LOG [RouterExplorer] Mapped {/api/products/:id, PATCH} route +1ms
[Nest] 1  - 04/17/2025, 3:18:07 AM     LOG [RoutesResolver] OrdersController {/api/orders}: +0ms
[Nest] 1  - 04/17/2025, 3:18:07 AM     LOG [RouterExplorer] Mapped {/api/orders, POST} route +0ms
[Nest] 1  - 04/17/2025, 3:18:07 AM     LOG [RouterExplorer] Mapped {/api/orders, GET} route +1ms
[Nest] 1  - 04/17/2025, 3:18:07 AM     LOG [RouterExplorer] Mapped {/api/orders/:status, GET} route +0ms
[Nest] 1  - 04/17/2025, 3:18:07 AM     LOG [RouterExplorer] Mapped {/api/orders/id/:id, GET} route +1ms
[Nest] 1  - 04/17/2025, 3:18:07 AM     LOG [RouterExplorer] Mapped {/api/orders/:id, PATCH} route +0ms
[Nest] 1  - 04/17/2025, 3:18:07 AM     LOG [RoutesResolver] AuthController {/api/auth}: +0ms
[Nest] 1  - 04/17/2025, 3:18:07 AM     LOG [RouterExplorer] Mapped {/api/auth/register, POST} route +0ms
[Nest] 1  - 04/17/2025, 3:18:07 AM     LOG [RouterExplorer] Mapped {/api/auth/login, POST} route +1ms
[Nest] 1  - 04/17/2025, 3:18:07 AM     LOG [RouterExplorer] Mapped {/api/auth/verify, GET} route +0ms
[Nest] 1  - 04/17/2025, 3:18:07 AM     LOG [NestApplication] Nest application successfully started +2ms
[Nest] 1  - 04/17/2025, 3:18:07 AM     LOG [Main-Gateway] Gateway running on port 3000
[Nest] 1  - 04/17/2025, 11:19:03 AM   ERROR [ExceptionsHandler] Error: getaddrinfo ENOTFOUND nats-server
    at GetAddrInfoReqWrap.onlookupall [as oncomplete] (node:dns:120:26) {
  errno: -3008,
  code: 'ENOTFOUND',
  syscall: 'getaddrinfo',
  hostname: 'nats-server'
}
[Nest] 1  - 04/17/2025, 12:44:47 PM   ERROR [ExceptionsHandler] NatsError: TIMEOUT
    at NatsError.errorForCode (/usr/src/app/node_modules/nats/lib/nats-base-client/core.js:143:16)
    at timeout (/usr/src/app/node_modules/nats/lib/nats-base-client/util.js:69:48)
    at ProtocolHandler.<anonymous> (/usr/src/app/node_modules/nats/lib/nats-base-client/protocol.js:415:44)
    at Generator.next (<anonymous>)
    at /usr/src/app/node_modules/nats/lib/nats-base-client/protocol.js:8:71
    at new Promise (<anonymous>)
    at __awaiter (/usr/src/app/node_modules/nats/lib/nats-base-client/protocol.js:4:12)
    at ProtocolHandler.dial (/usr/src/app/node_modules/nats/lib/nats-base-client/protocol.js:411:16)
    at ProtocolHandler.<anonymous> (/usr/src/app/node_modules/nats/lib/nats-base-client/protocol.js:482:32)
    at Generator.next (<anonymous>) {
  code: 'TIMEOUT',
  chainedError: undefined
}
```

- No puede conectar con el microservicio de NATS porque no está configurado correctamente.
- Tenemos que cambiar el deployment del microservicio de client-gateway para que se conecte al microservicio de NATS correctamente.

> 02-Products-App/k8s/nestjs-microservicios/templates/client-gateway/deployment.yaml

```diff
apiVersion: apps/v1
kind: Deployment
metadata:
  creationTimestamp: null
  labels:
    app: client-gateway
  name: client-gateway
spec:
  replicas: 1
  selector:
    matchLabels:
      app: client-gateway
  strategy: {}
  template:
    metadata:
      creationTimestamp: null
      labels:
        app: client-gateway
    spec:
      containers:
      - image: europe-southwest1-docker.pkg.dev/nestjs-microservicios-456909/nestjs-microservicios/client-gateway:latest
        name: client-gateway
        resources: {}
        env:
          - name: PORT
            value: "3000"
          - name: NATS_SERVERS
            # No hay que poner ningún puerto
+           value: "nats://nats-server"
status: {}
```

- Una vez que aplicacos el deployment al cluster usando `helm upgrade` y ejecutamos el documento `02-Products-App/client-gateway/src/products/products.http` vemos que el error es diferente.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
kubectl get pods
NAME                             READY   STATUS        RESTARTS     AGE
client-gateway-646498669-rnvcl   1/1     Terminating   1 (9h ago)   19h
client-gateway-6dfc9847f-826tr   1/1     Running       0            14s
nats-server-86f8857d9d-rqhfm     1/1     Running       0            13m
```

- Al ver los logs del microservicio de client-gateway vemos que el error es diferente.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$ kubectl logs client-gateway-6dfc9847f-826tr
[Nest] 1  - 04/17/2025, 12:51:06 PM     LOG [NestFactory] Starting Nest application...
[Nest] 1  - 04/17/2025, 12:51:06 PM     LOG [InstanceLoader] AppModule dependencies initialized +14ms
[Nest] 1  - 04/17/2025, 12:51:06 PM     LOG [InstanceLoader] NatsModule dependencies initialized +1ms
[Nest] 1  - 04/17/2025, 12:51:06 PM     LOG [InstanceLoader] ClientsModule dependencies initialized +0ms
[Nest] 1  - 04/17/2025, 12:51:06 PM     LOG [InstanceLoader] ProductsModule dependencies initialized +1ms
[Nest] 1  - 04/17/2025, 12:51:06 PM     LOG [InstanceLoader] OrdersModule dependencies initialized +0ms
[Nest] 1  - 04/17/2025, 12:51:06 PM     LOG [InstanceLoader] AuthModule dependencies initialized +0ms
[Nest] 1  - 04/17/2025, 12:51:06 PM     LOG [RoutesResolver] ProductsController {/api/products}: +5ms
[Nest] 1  - 04/17/2025, 12:51:06 PM     LOG [RouterExplorer] Mapped {/api/products, POST} route +3ms
[Nest] 1  - 04/17/2025, 12:51:06 PM     LOG [RouterExplorer] Mapped {/api/products, GET} route +1ms
[Nest] 1  - 04/17/2025, 12:51:06 PM     LOG [RouterExplorer] Mapped {/api/products/:id, GET} route +1ms
[Nest] 1  - 04/17/2025, 12:51:06 PM     LOG [RouterExplorer] Mapped {/api/products/:id, DELETE} route +1ms
[Nest] 1  - 04/17/2025, 12:51:06 PM     LOG [RouterExplorer] Mapped {/api/products/:id, PATCH} route +0ms
[Nest] 1  - 04/17/2025, 12:51:06 PM     LOG [RoutesResolver] OrdersController {/api/orders}: +1ms
[Nest] 1  - 04/17/2025, 12:51:06 PM     LOG [RouterExplorer] Mapped {/api/orders, POST} route +0ms
[Nest] 1  - 04/17/2025, 12:51:06 PM     LOG [RouterExplorer] Mapped {/api/orders, GET} route +0ms
[Nest] 1  - 04/17/2025, 12:51:06 PM     LOG [RouterExplorer] Mapped {/api/orders/:status, GET} route +1ms
[Nest] 1  - 04/17/2025, 12:51:06 PM     LOG [RouterExplorer] Mapped {/api/orders/id/:id, GET} route +0ms
[Nest] 1  - 04/17/2025, 12:51:06 PM     LOG [RouterExplorer] Mapped {/api/orders/:id, PATCH} route +1ms
[Nest] 1  - 04/17/2025, 12:51:06 PM     LOG [RoutesResolver] AuthController {/api/auth}: +0ms
[Nest] 1  - 04/17/2025, 12:51:06 PM     LOG [RouterExplorer] Mapped {/api/auth/register, POST} route +0ms
[Nest] 1  - 04/17/2025, 12:51:06 PM     LOG [RouterExplorer] Mapped {/api/auth/login, POST} route +0ms
[Nest] 1  - 04/17/2025, 12:51:06 PM     LOG [RouterExplorer] Mapped {/api/auth/verify, GET} route +1ms
[Nest] 1  - 04/17/2025, 12:51:06 PM     LOG [NestApplication] Nest application successfully started +2ms
[Nest] 1  - 04/17/2025, 12:51:06 PM     LOG [Main-Gateway] Gateway running on port 3000
[Nest] 1  - 04/17/2025, 12:52:21 PM   ERROR [ExceptionsHandler] EmptyResponseException [Error]: Empty response. There are no subscribers listening to that message ("{"cmd":"create-product"}")
    at SubscriptionImpl.callback (/usr/src/app/node_modules/@nestjs/microservices/client/client-nats.js:115:26)
    at ProtocolHandler.processMsg (/usr/src/app/node_modules/nats/lib/nats-base-client/protocol.js:615:17)
    at ProtocolHandler.push (/usr/src/app/node_modules/nats/lib/nats-base-client/protocol.js:722:22)
    at Parser.parse (/usr/src/app/node_modules/nats/lib/nats-base-client/parser.js:212:41)
    at ProtocolHandler.<anonymous> (/usr/src/app/node_modules/nats/lib/nats-base-client/protocol.js:426:45)
    at Generator.next (<anonymous>)
    at fulfilled (/usr/src/app/node_modules/nats/lib/nats-base-client/protocol.js:5:58)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
```

- Vemos que el error es que no hay ningún suscriptor escuchando el mensaje `{"cmd":"create-product"}`.
- Tenemos que crear el deployment del microservicio de products.

### 12.08 Crear el deployment del microservicio de products

- Vamos a crear el deployment del microservicio de products en el directorio `02-Products-App/k8s/nestjs-microservicios/templates/products`.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios/templates$
mkdir products
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios/templates$
cd products
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios/templates/products$
kubectl create deployment products --image=europe-southwest1-docker.pkg.dev/nestjs-microservicios-456909/nestjs-microservicios/products-ms:latest --dry-run=client -o yaml > deployment.yaml
```

- Podemos ver el archivo `deployment.yaml` creado.

> 02-Products-App/k8s/nestjs-microservicios/templates/products/deployment.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  creationTimestamp: null
  labels:
    app: products
  name: products
spec:
  replicas: 1
  selector:
    matchLabels:
      app: products
  strategy: {}
  template:
    metadata:
      creationTimestamp: null
      labels:
        app: products
    spec:
      containers:
      - image: europe-southwest1-docker.pkg.dev/nestjs-microservicios-456909/nestjs-microservicios/products-ms:latest
        name: products-ms
        resources: {}
status: {}
```

- Tenemos que añadir las variables de entorno al deployment del microservicio de products.

> 02-Products-App/k8s/nestjs-microservicios/templates/products/deployment.yaml

```diff
apiVersion: apps/v1
kind: Deployment
metadata:
  creationTimestamp: null
  labels:
    app: products
  name: products
spec:
  replicas: 1
  selector:
    matchLabels:
      app: products
  strategy: {}
  template:
    metadata:
      creationTimestamp: null
      labels:
        app: products
    spec:
      containers:
      - image: europe-southwest1-docker.pkg.dev/nestjs-microservicios-456909/nestjs-microservicios/products-ms:latest
        name: products-ms
        resources: {}
+       env:
+         - name: PORT
+           value: "3001"
+         - name: NATS_SERVERS
+           value: "nats://nats-server"
+         - name: PRODUCTS_DATABASE_URL
+           value: "file:./dev.db"
status: {}
```

- Vamos a aplicar el deployment al cluster usando `helm upgrade`.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/helm upgrade nestjs-microservicios .
Release "nestjs-microservicios" has been upgraded. Happy Helming!
NAME: nestjs-microservicios
LAST DEPLOYED: Thu Apr 17 15:13:39 2025
NAMESPACE: default
STATUS: deployed
REVISION: 13
TEST SUITE: None
```

- Vamos a ver el estado de los pods en el cluster.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
kubectl get pods
NAME                             READY   STATUS    RESTARTS   AGE
client-gateway-6dfc9847f-826tr   1/1     Running   0          22m
nats-server-86f8857d9d-rqhfm     1/1     Running   0          36m
products-7b6d948797-ff59z        1/1     Running   0          17s
```

- Vamos a ejecutar el endpoint `02-Products-App/client-gateway/src/products/products.http` y vemos que el microservicio de products está funcionando.
- Obtenemos esta respuesta:

```JSON
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 1393
ETag: W/"571-7PPTjxFYsXwlEt1GqPWuYpn4J3w"
Date: Thu, 17 Apr 2025 13:14:36 GMT
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
    {
      "id": 5,
      "name": "Audífonos",
      "price": 50,
      "available": true,
      "createdAt": "2024-02-27T15:50:48.406Z",
      "updatedAt": "2024-02-27T15:50:48.406Z"
    },
    .
  ],
  "meta": {
    "total": 47,
    "page": 1,
    "lastPage": 5
  }
```

- Vamos a ver los logs del microservicio de products.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
kubectl logs products-7b6d948797-ff59z
[Nest] 1  - 04/17/2025, 1:13:42 PM     LOG [NestFactory] Starting Nest application...
[Nest] 1  - 04/17/2025, 1:13:42 PM     LOG [InstanceLoader] AppModule dependencies initialized +12ms
[Nest] 1  - 04/17/2025, 1:13:42 PM     LOG [InstanceLoader] ProductsModule dependencies initialized +1ms
[Nest] 1  - 04/17/2025, 1:13:42 PM     LOG [ProductsService] Connected to the database
[Nest] 1  - 04/17/2025, 1:13:42 PM     LOG [NestMicroservice] Nest microservice successfully started +80ms
[Nest] 1  - 04/17/2025, 1:13:42 PM     LOG [Main] Products Microservice running on port 3001
```

### 12.09 Crear el deployment del microservicio de orders

- Vamos a crear el deployment del microservicio de orders en el directorio `02-Products-App/k8s/nestjs-microservicios/templates/orders`.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios/templates$
mkdir orders-ms
juanpabloperez@jpp-PROX15-AMD:~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios/templates$
cd orders-ms
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios/templates/orders-ms$
kubectl create deployment orders-ms --image=europe-southwest1-docker.pkg.dev/nestjs-microservicios-456909/nestjs-microservicios/orders-ms:latest --dry-run=client -o yaml > deployment.yaml
```

- Podemos ver el archivo `deployment.yaml` creado.

> 02-Products-App/k8s/nestjs-microservicios/templates/orders-ms/deployment.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  creationTimestamp: null
  labels:
    app: orders-ms
  name: orders-ms
spec:
  replicas: 1
  selector:
    matchLabels:
      app: orders-ms
  strategy: {}
  template:
    metadata:
      creationTimestamp: null
      labels:
        app: orders-ms
    spec:
      containers:
      - image: europe-southwest1-docker.pkg.dev/nestjs-microservicios-456909/nestjs-microservicios/orders-ms:latest
        name: orders-ms
        resources: {}
status: {}
```

- Vamos a añadir las variables de entorno al deployment del microservicio de orders.
- La variable de `ORDERS_DATABASE_URL` no la podemos añadir directamente porque contiene valores con información sensible.
- Vamos a crear un nuevo archivo `02-Products-App/k8s/nestjs-microservicios/templates/orders-ms/secret.yaml` para añadir la variable de entorno `ORDERS_DATABASE_URL`.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios/templates/orders-ms$ 
kubectl create secret generic orders-ms-secrets --from-literal=ORDERS_DATABASE_URL="postgresql://neondb_owner:ZZZZZZZZZ@ep-steep-river-a2p3lezj-pooler.eu-central-1.aws.n
eon.tech/orders-db?sslmode=require"
secret/orders-ms-secrets created
```

- Podemos ver el secreto creado ejecutando `kubectl get secrets`.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios/templates/orders-ms$
kubectl get secrets
NAME                                           TYPE                             DATA   AGE
gcr-json-key                                   kubernetes.io/dockerconfigjson   1      20h
orders-ms-secrets                              Opaque                           1      67s
sh.helm.release.v1.nestjs-microservicios.v10   helm.sh/release.v1               1      37m
sh.helm.release.v1.nestjs-microservicios.v11   helm.sh/release.v1               1      34m
sh.helm.release.v1.nestjs-microservicios.v12   helm.sh/release.v1               1      30m
sh.helm.release.v1.nestjs-microservicios.v13   helm.sh/release.v1               1      27m
sh.helm.release.v1.nestjs-microservicios.v4    helm.sh/release.v1               1      20h
sh.helm.release.v1.nestjs-microservicios.v5    helm.sh/release.v1               1      20h
sh.helm.release.v1.nestjs-microservicios.v6    helm.sh/release.v1               1      148m
sh.helm.release.v1.nestjs-microservicios.v7    helm.sh/release.v1               1      63m
sh.helm.release.v1.nestjs-microservicios.v8    helm.sh/release.v1               1      58m
sh.helm.release.v1.nestjs-microservicios.v9    helm.sh/release.v1               1      50m
```

- Tenemos que añadir las variables de entorno al deployment del microservicio de orders.

> 02-Products-App/k8s/nestjs-microservicios/templates/orders-ms/deployment.yaml

```diff
apiVersion: apps/v1
kind: Deployment
metadata:
  creationTimestamp: null
  labels:
    app: orders-ms
  name: orders-ms
spec:
  replicas: 1
  selector:
    matchLabels:
      app: orders-ms
  strategy: {}
  template:
    metadata:
      creationTimestamp: null
      labels:
        app: orders-ms
    spec:
      containers:
      - image: europe-southwest1-docker.pkg.dev/nestjs-microservicios-456909/nestjs-microservicios/orders-ms:latest
        name: orders-ms
        resources: {}
+       env:
+         - name: PORT
+           # Podemos usar cualquier puerto que queramos ya que es interno
+           value: "3000"
+         - name: NATS_SERVERS
+           value: "nats://nats-server"
+         - name: ORDERS_DATABASE_URL
+           # Se obtiene el valor del secreto `orders-ms-secrets` y se asigna a la variable de entorno `ORDERS_DATABASE_URL`
+           valueFrom:
+             secretKeyRef:
+               name: orders-ms-secrets
+               key: ORDERS_DATABASE_URL
status: {}
```

- Vamos a aplicar el deployment al cluster usando `helm upgrade`.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
helm upgrade nestjs-microservicios .
Release "nestjs-microservicios" has been upgraded. Happy Helming!
NAME: nestjs-microservicios
LAST DEPLOYED: Thu Apr 17 15:47:07 2025
NAMESPACE: default
STATUS: deployed
REVISION: 14
TEST SUITE: None
```

- Vamos a ver el estado de los pods en el cluster.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
 kubectl get pods
NAME                             READY   STATUS    RESTARTS   AGE
client-gateway-6dfc9847f-826tr   1/1     Running   0          56m
nats-server-86f8857d9d-rqhfm     1/1     Running   0          70m
orders-ms-68df7875b5-s5mtv       1/1     Running   0          20s
products-7b6d948797-ff59z        1/1     Running   0          33m
```

- Vamos a ver los logs del microservicio de orders-ms.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
kubectl logs orders-ms-68df7875b5-s5mtv
[Nest] 1  - 04/17/2025, 1:47:19 PM     LOG [NestFactory] Starting Nest application...
[Nest] 1  - 04/17/2025, 1:47:19 PM     LOG [InstanceLoader] AppModule dependencies initialized +12ms
[Nest] 1  - 04/17/2025, 1:47:19 PM     LOG [InstanceLoader] NatsModule dependencies initialized +0ms
[Nest] 1  - 04/17/2025, 1:47:19 PM     LOG [InstanceLoader] ClientsModule dependencies initialized +0ms
[Nest] 1  - 04/17/2025, 1:47:19 PM     LOG [InstanceLoader] OrdersModule dependencies initialized +1ms
[Nest] 1  - 04/17/2025, 1:47:20 PM     LOG [OrdersService] Connected to database
[Nest] 1  - 04/17/2025, 1:47:20 PM     LOG [NestMicroservice] Nest microservice successfully started +121ms
[Nest] 1  - 04/17/2025, 1:47:20 PM     LOG [OrdersMS-Main] OrdersMS Microservice running on port 3000
```

- Vamos a comprobar si podemos ejecutar el endpoint `02-Products-App/client-gateway/src/orders/orders.http` y vemos que el microservicio de orders está funcionando.

> 02-Products-App/client-gateway/src/orders/orders.http

```http
# URL del servicio de Kubernetes
@url = http://localhost:30940/api/orders

### Obtener todos los pedidos
GET {{url}}?page=1&limit=10&status=PENDING
```

- Obtenemos esta respuesta:

```JSON
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 2076
ETag: W/"81c-3hBn+Js+sYD9z3G7nKtMcNKVppg"
Date: Thu, 17 Apr 2025 13:51:19 GMT
Connection: close

{
  "data": [
    {
      "id": "5ab9851a-79a8-4dbd-b8c8-ccd72d7f8584",
      "totalAmount": 350,
      "totalItems": 3,
      "status": "PENDING",
      "paid": false,
      "paidAt": null,
      "stripeChargeId": null,
      "createdAt": "2025-04-14T17:00:52.969Z",
      "updatedAt": "2025-04-14T17:00:52.969Z"
    },
    {
      "id": "6c6c9766-b355-4761-8123-c030fb8efe4f",
      "totalAmount": 350,
      "totalItems": 3,
      "status": "PENDING",
      "paid": false,
      "paidAt": null,
      "stripeChargeId": null,
      "createdAt": "2025-04-14T17:00:46.133Z",
      "updatedAt": "2025-04-14T17:00:46.133Z"
    },
    {
      "id": "748d0f3c-8a3f-4c36-a3f0-398af8ea50de",
      "totalAmount": 350,
      "totalItems": 3,
      "status": "PENDING",
      "paid": false,
      "paidAt": null,
      "stripeChargeId": null,
      "createdAt": "2025-04-14T17:00:51.190Z",
      "updatedAt": "2025-04-14T17:00:51.190Z"
    },
    ...
  ],
  "meta": {
    "total": 9,
    "page": 1,
    "lastPage": 1
  }
}
```

### 12.10 Crear el deployment del microservicio de auth-ms

- Vamos a crear el servicio de auth-ms en el directorio `02-Products-App/k8s/nestjs-microservicios/templates/auth-ms`.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios/templates$
mkdir auth-ms
juanpabloperez@jpp-PROX15-AMD:~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios/templates$
cd auth-ms
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios/templates/auth-ms$
kubectl create deployment auth-ms --image=europe-southwest1-docker.pkg.dev/nestjs-microservicios-456909/nestjs-microservicios/auth-ms:latest --dry-run=client -o yaml > deployment.yaml
```

- Podemos ver el archivo `deployment.yaml` creado.

> 02-Products-App/k8s/nestjs-microservicios/templates/auth-ms/deployment.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  creationTimestamp: null
  labels:
    app: auth-ms
  name: auth-ms
spec:
  replicas: 1
  selector:
    matchLabels:
      app: auth-ms
  strategy: {}
  template:
    metadata:
      creationTimestamp: null
      labels:
        app: auth-ms
    spec:
      containers:
      - image: europe-southwest1-docker.pkg.dev/nestjs-microservicios-456909/nestjs-microservicios/auth-ms:latest
        name: auth-ms
        resources: {}
status: {}
```

- En este microservicio tenemos dos secretos: `JWT_SECRET` y `AUTH_DATABASE_URL`.
- Vamos a crear los dos secretos con el siguiente comando:

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios/templates/auth-ms$
kubectl create secret generic auth-ms-secrets --from-literal=JWT_SECRET="CBm2b6nKXXXXXXXYwqDbUmxAJl" --from-literal=AUTH_DATABASE_URL="mongodb+srv://ZZZZZZZZ:YYYYYYYYYYYY@testing.q6ff3cq.mongodb.net/AuthDB"
secret/auth-ms-secrets created
```

- Vamos a añadir las variables de entorno al deployment del microservicio de auth-ms.

> 02-Products-App/k8s/nestjs-microservicios/templates/auth-ms/deployment.yaml

```diff
apiVersion: apps/v1
kind: Deployment
metadata:
  creationTimestamp: null
  labels:
    app: auth-ms
  name: auth-ms
spec:
  replicas: 1
  selector:
    matchLabels:
      app: auth-ms
  strategy: {}
  template:
    metadata:
      creationTimestamp: null
      labels:
        app: auth-ms
    spec:
      containers:
      - image: europe-southwest1-docker.pkg.dev/nestjs-microservicios-456909/nestjs-microservicios/auth-ms:latest
        name: auth-ms
        resources: {}
+       env:
+         - name: PORT
+           value: "3000"
+         - name: NATS_SERVERS
+           value: "nats://nats-server"
+         - name: JWT_SECRET
+           valueFrom:
+             secretKeyRef:
+               name: auth-ms-secrets
+               key: JWT_SECRET
+         - name: AUTH_DATABASE_URL
+           valueFrom:
+             secretKeyRef:
+               name: auth-ms-secrets
+               key: AUTH_DATABASE_URL
status: {}
```

- Vamos a aplicar el deployment al cluster usando `helm upgrade`.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
helm upgrade nestjs-microservicios .
Release "nestjs-microservicios" has been upgraded. Happy Helming!
NAME: nestjs-microservicios
LAST DEPLOYED: Thu Apr 17 16:18:58 2025
NAMESPACE: default
STATUS: deployed
REVISION: 15
TEST SUITE: None
```

- Vamos a ver el estado de los pods en el cluster.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
kubectl get pods
NAME                             READY   STATUS    RESTARTS   AGE
auth-ms-6f6868f448-jwmbc         1/1     Running   0          28s
client-gateway-6dfc9847f-826tr   1/1     Running   0          88m
nats-server-86f8857d9d-rqhfm     1/1     Running   0          102m
orders-ms-68df7875b5-s5mtv       1/1     Running   0          32m
products-7b6d948797-ff59z        1/1     Running   0          65m
```

- Vamos a ver los logs del microservicio de auth-ms.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
kubectl logs auth-ms-6f6868f448-jwmbc
[Nest] 1  - 04/17/2025, 2:19:10 PM     LOG [NestFactory] Starting Nest application...
[Nest] 1  - 04/17/2025, 2:19:10 PM     LOG [InstanceLoader] AppModule dependencies initialized +9ms
[Nest] 1  - 04/17/2025, 2:19:10 PM     LOG [InstanceLoader] JwtModule dependencies initialized +1ms
[Nest] 1  - 04/17/2025, 2:19:10 PM     LOG [InstanceLoader] AuthModule dependencies initialized +2ms
[Nest] 1  - 04/17/2025, 2:19:10 PM     LOG [AuthService] MongoDB connected
[Nest] 1  - 04/17/2025, 2:19:10 PM     LOG [NestMicroservice] Nest microservice successfully started +92ms
[Nest] 1  - 04/17/2025, 2:19:10 PM     LOG [Auth-ms] Auth Microservice running on port 3000
```

- Vamos a modificar el archivo `02-Products-App/client-gateway/src/auth/auth.http` para que se pueda acceder al microservicio de auth-ms.

> 02-Products-App/client-gateway/src/auth/auth.http

```http
@url = http://localhost:30940/api/auth

### Login
# @name login
POST {{url}}/login
Content-Type: application/json

{
  "email": "usuario@gmail.com",
  "password": "1234567!02JSJSJSssswd"
}
```

- Vamos a comprobar si podemos ejecutar el endpoint `02-Products-App/client-gateway/src/auth/auth.http` y vemos que si microservicio de auth-ms está funcionando.

```JSON
HTTP/1.1 201 Created
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 338
ETag: W/"152-YeefwO4M/gkfEVMQE/R1q6iEk7w"
Date: Thu, 17 Apr 2025 14:43:58 GMT
Connection: close

{
  "user": {
    "id": "67fd1e8f3e959909a8d14283",
    "email": "usuario@gmail.com",
    "name": "Usuario XXX"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3ZmQxZThmM2U5NTk5MDlhOGQxNDI4MyIsImVtYWlsIjoidXN1YXJpb0BnbWFpbC5jb20iLCJuYW1lIjoiVXN1YXJpbyBYWFgiLCJpYXQiOjE3NDQ5MDEwMzgsImV4cCI6MTc0NDkwODIzOH0.zoABZ2ofkeFoZRKydCEr8RBnqpfEpsWwcKmPSgd5bp4"
}
```

### 12.11 Crear el deployment del microservicio de payments-ms

- Vamos a crear el servicio de payments-ms en el directorio `02-Products-App/k8s/nestjs-microservicios/templates/payments-ms`.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios/templates$
mkdir payments-ms
juanpabloperez@jpp-PROX15-AMD:~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios/templates$
cd payments-ms
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios/templates/payments-ms$
kubectl create deployment payments-ms --image=europe-southwest1-docker.pkg.dev/nestjs-microservicios-456909/nestjs-microservicios/payments-ms:latest --dry-run=client -o yaml > deployment.yaml
```

- Podemos ver el archivo `deployment.yaml` creado.

> 02-Products-App/k8s/nestjs-microservicios/templates/payments-ms/deployment.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  creationTimestamp: null
  labels:
    app: payments-ms
  name: payments-ms
spec:
  replicas: 1
  selector:
    matchLabels:
      app: payments-ms
  strategy: {}
  template:
    metadata:
      creationTimestamp: null
      labels:
        app: payments-ms
    spec:
      containers:
      - image: europe-southwest1-docker.pkg.dev/nestjs-microservicios-456909/nestjs-microservicios/payments-ms:latest
        name: payments-ms
        resources: {}
status: {}
```

- Vamos a crear el secret para el microservicio de payments-ms.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios/templates/payments-ms$
kubectl create secret generic payments-ms-secrets --from-literal=STRIPE_SECRET="sk_test_xxxxx" --from-literal=STRIPE_ENDPOINT_SECRET="whsec_yyyyy"
secret/payments-ms-secrets created
```

- Vamos a añadir las variables de entorno al deployment del microservicio de payments-ms.

> 02-Products-App/k8s/nestjs-microservicios/templates/payments-ms/deployment.yaml

```diff
apiVersion: apps/v1
kind: Deployment
metadata:
  creationTimestamp: null
  labels:
    app: payments-ms
  name: payments-ms
spec:
  replicas: 1
  selector:
    matchLabels:
      app: payments-ms
  strategy: {}
  template:
    metadata:
      creationTimestamp: null
      labels:
        app: payments-ms
    spec:
      containers:
      - image: europe-southwest1-docker.pkg.dev/nestjs-microservicios-456909/nestjs-microservicios/payments-ms:latest
        name: payments-ms
        resources: {}
+       env:
+         - name: PORT
+           value: "3000"
+         - name: NATS_SERVERS
+           value: "nats://nats-server"
+         - name: STRIPE_SUCCESS_URL
+           value: "http://localhost:3000/payments/success"
+         - name: STRIPE_CANCEL_URL
+           value: "http://localhost:3000/payments/cancel"
+         - name: STRIPE_SECRET
+           valueFrom:
+             secretKeyRef:
+               name: payments-ms-secrets
+               key: STRIPE_SECRET
+         - name: STRIPE_ENDPOINT_SECRET
+           valueFrom:
+             secretKeyRef:
+               name: payments-ms-secrets
+               key: STRIPE_ENDPOINT_SECRET
status: {}
```

- Vamos a aplicar el deployment al cluster usando `helm upgrade`.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
helm upgrade nestjs-microservicios .
Release "nestjs-microservicios" has been upgraded. Happy Helming!
NAME: nestjs-microservicios
LAST DEPLOYED: Thu Apr 17 17:07:35 2025
NAMESPACE: default
STATUS: deployed
REVISION: 18
TEST SUITE: None
```

- Vamos a ver el estado de los pods en el cluster.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
kubectl get pods
NAME                             READY   STATUS    RESTARTS   AGE
auth-ms-6f6868f448-jwmbc         1/1     Running   0          52m
client-gateway-6dfc9847f-826tr   1/1     Running   0          140m
nats-server-86f8857d9d-rqhfm     1/1     Running   0          154m
orders-ms-68df7875b5-s5mtv       1/1     Running   0          84m
payments-ms-5b796c9cd5-5tq4m     1/1     Running   0          5s
products-7b6d948797-ff59z        1/1     Running   0          117m
```

- Vamos a ver los logs del microservicio de payments-ms.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
kubectl logs payments-ms-5b796c9cd5-5tq4m
[Nest] 1  - 04/17/2025, 3:11:31 PM     LOG [NestFactory] Starting Nest application...
[Nest] 1  - 04/17/2025, 3:11:31 PM     LOG [InstanceLoader] AppModule dependencies initialized +16ms
[Nest] 1  - 04/17/2025, 3:11:31 PM     LOG [InstanceLoader] NatsModule dependencies initialized +0ms
[Nest] 1  - 04/17/2025, 3:11:31 PM     LOG [InstanceLoader] ClientsModule dependencies initialized +0ms
[Nest] 1  - 04/17/2025, 3:11:31 PM     LOG [InstanceLoader] PaymentsModule dependencies initialized +1ms
[Nest] 1  - 04/17/2025, 3:11:31 PM     LOG [NestMicroservice] Nest microservice successfully started +130ms
[Nest] 1  - 04/17/2025, 3:11:31 PM     LOG [RoutesResolver] PaymentsController {/payments}: +7ms
[Nest] 1  - 04/17/2025, 3:11:31 PM     LOG [RouterExplorer] Mapped {/payments/create-payment-session, POST} route +4ms
[Nest] 1  - 04/17/2025, 3:11:31 PM     LOG [RouterExplorer] Mapped {/payments/success, GET} route +3ms
[Nest] 1  - 04/17/2025, 3:11:31 PM     LOG [RouterExplorer] Mapped {/payments/cancel, GET} route +1ms
[Nest] 1  - 04/17/2025, 3:11:31 PM     LOG [RouterExplorer] Mapped {/payments/webhook, POST} route +1ms
[Nest] 1  - 04/17/2025, 3:11:31 PM     LOG [NestApplication] Nest application successfully started +3ms
[Nest] 1  - 04/17/2025, 3:11:31 PM     LOG [Payments-ms] Payments Microservice running on port 3000
```

- Vamos a crear un nuevo pedido desde el archivo `02-Products-App/client-gateway/src/payments/payments.http` para que nos aseguremos de que el microservicio de payments-ms está funcionando.

> 02-Products-App/client-gateway/src/payments/payments.http

```http
# URL del servicio de Kubernetes
@url = http://localhost:30940/api/orders

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

- Recibimos la respuesta:

```JSON
HTTP/1.1 201 Created
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 771
ETag: W/"303-HklWdu83E76AN8UWpJqL63fJU2Q"
Date: Thu, 17 Apr 2025 15:14:58 GMT
Connection: close

{
  "order": {
    "id": "3e9d30cf-08e0-4dfc-9bf0-ed56170ffe20",
    "totalAmount": 350,
    "totalItems": 3,
    "status": "PENDING",
    "paid": false,
    "paidAt": null,
    "stripeChargeId": null,
    "createdAt": "2025-04-17T15:14:55.592Z",
    "updatedAt": "2025-04-17T15:14:55.592Z",
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
    "url": "https://checkout.stripe.com/c/pay/cs_test_b10GisGtIeDMkfVutJxFX5xLU5wvABo3Dt6k2Kqvg0W7kbC5y2tOnr831c#fidkdWxOYHwnPyd1blpxYHZxWkRPTlx2VkdOVGh%2FZ3NdSjNmMkFMVFdgZDU1SFBuMElvRmYnKSdjd2poVmB3c2B3Jz9xd3BgKSdpZHxqcHFRfHVgJz8naHBpcWxabHFgaCcpJ2BrZGdpYFVpZGZgbWppYWB3dic%2FcXdwYHgl"
  }
}
```

### 12.12 Crear un nuevo servicio de payment-ms para que stripe pueda mandar los webhooks

- Vamos a crear el servicio de payment-ms en el directorio `02-Products-App/k8s/nestjs-microservicios/templates/payment-ms`.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios/templates/payment-ms$
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios/templates/payment-ms$
kubectl create service nodeport payments-ms --tcp=3000 --dry-run=client -o yaml > service.yaml
```

- Podemos ver el archivo `service.yaml` creado. 

> 02-Products-App/k8s/nestjs-microservicios/templates/payment-ms/service.yaml

```yaml
apiVersion: v1
kind: Service
metadata:
  creationTimestamp: null
  labels:
    app: payments-ms
  name: payments-ms
spec:
  ports:
  - name: "3000"
    port: 3000
    protocol: TCP
    targetPort: 3000
  selector:
    app: payments-ms
  type: NodePort
status:
  loadBalancer: {}
```

- Vamos a aplicar el servicio al cluster usando `helm upgrade`.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
helm upgrade nestjs-microservicios .
Release "nestjs-microservicios" has been upgraded. Happy Helming!
NAME: nestjs-microservicios
LAST DEPLOYED: Thu Apr 17 17:35:28 2025
NAMESPACE: default
STATUS: deployed
REVISION: 20
TEST SUITE: None
```

- Vamos a ver el estado de los servicios en el cluster.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
kubectl get services
NAME             TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
client-gateway   NodePort    10.107.98.249   <none>        3000:30940/TCP   5h33m
kubernetes       ClusterIP   10.96.0.1       <none>        443/TCP          25h
nats-server      ClusterIP   10.108.36.158   <none>        4222/TCP         4h3m
payments-ms      NodePort    10.99.140.223   <none>        3000:32697/TCP   4s
```

- Vemos que el servicio de payment-ms está funcionando y que se puede acceder desde el puerto 32697.
- Vamos a actualizar el archivo `02-Products-App/payments-ms/src/payments/payments.http` para que se pueda acceder al servicio de payment-ms.

> 02-Products-App/payments-ms/src/payments/payments.http

```http
@url = http://localhost:3003/payments

# URL del servicio de payment-ms
@url = http://localhost:32697/payments

### Crear una sesión de pago
POST {{url}}/create-payment-session
Content-Type: application/json

{
  "orderId": "1234567890",
  "currency": "USD",
  "items": [
    {
      "name": "Producto 1",
      "price": 100,
      "quantity": 1
    },
    {
      "name": "Producto 2",
      "price": 200,
      "quantity": 2
    }
  ]
}

### Obtener confirmación de pago
GET {{url}}/success

### Obtener cancelación de pago
GET {{url}}/cancel

### Obtener webhook de Stripe
POST {{url}}/webhook
Content-Type: application/json

{
  "event": "payment_intent.succeeded"
}
```

- Si ejecutamos el endpoint `POST {{url}}/webhook` con el evento `payment_intent.succeeded` y le damos a `Execute` veremos que se ejecuta el webhook con esta respuesta:

```JSON
HTTP/1.1 400 Bad Request
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 36
ETag: W/"24-72GsP6PXHQUkxvXqWR2GlU3asEo"
Date: Thu, 17 Apr 2025 16:48:17 GMT
Connection: close

{
  "error": "Missing stripe signature"
}
```

- Vamos a ver los pods que tenemos en el cluster.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$ kubectl get pods
NAME                             READY   STATUS    RESTARTS   AGE
auth-ms-6f6868f448-jwmbc         1/1     Running   0          150m
client-gateway-6dfc9847f-826tr   1/1     Running   0          3h58m
nats-server-86f8857d9d-rqhfm     1/1     Running   0          4h11m
orders-ms-68df7875b5-s5mtv       1/1     Running   0          3h2m
payments-ms-5b796c9cd5-mhp5m     1/1     Running   0          11m
products-7b6d948797-ff59z        1/1     Running   0          3h35m
```

- Podemos ver los logs del microservicio de payments-ms para ver que se ha ejecutado el webhook.

```bash
juanpabloperez@jpp-PROX15-AMD:~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$ kubectl logs payments-ms-5b796c9cd5-mhp5m
[Nest] 1  - 04/17/2025, 4:37:27 PM     LOG [NestFactory] Starting Nest application...
[Nest] 1  - 04/17/2025, 4:37:27 PM     LOG [InstanceLoader] AppModule dependencies initialized +16ms
[Nest] 1  - 04/17/2025, 4:37:27 PM     LOG [InstanceLoader] NatsModule dependencies initialized +1ms
[Nest] 1  - 04/17/2025, 4:37:27 PM     LOG [InstanceLoader] ClientsModule dependencies initialized +0ms
[Nest] 1  - 04/17/2025, 4:37:27 PM     LOG [InstanceLoader] PaymentsModule dependencies initialized +0ms
[Nest] 1  - 04/17/2025, 4:37:27 PM     LOG [NestMicroservice] Nest microservice successfully started +38ms
[Nest] 1  - 04/17/2025, 4:37:27 PM     LOG [RoutesResolver] PaymentsController {/payments}: +3ms
[Nest] 1  - 04/17/2025, 4:37:27 PM     LOG [RouterExplorer] Mapped {/payments/create-payment-session, POST} route +3ms
[Nest] 1  - 04/17/2025, 4:37:27 PM     LOG [RouterExplorer] Mapped {/payments/success, GET} route +1ms
[Nest] 1  - 04/17/2025, 4:37:27 PM     LOG [RouterExplorer] Mapped {/payments/cancel, GET} route +0ms
[Nest] 1  - 04/17/2025, 4:37:27 PM     LOG [RouterExplorer] Mapped {/payments/webhook, POST} route +0ms
[Nest] 1  - 04/17/2025, 4:37:27 PM     LOG [NestApplication] Nest application successfully started +2ms
[Nest] 1  - 04/17/2025, 4:37:27 PM     LOG [Payments-ms] Payments Microservice running on port 3000
[Nest] 1  - 04/17/2025, 4:48:17 PM   DEBUG [PaymentsController] Webhook request received
[Nest] 1  - 04/17/2025, 4:48:17 PM   DEBUG [PaymentsController] Headers: {"user-agent":"vscode-restclient","content-type":"application/json","accept-encoding":"gzip, deflate","content-length":"41","cookie":"session=eyJ1c2VySWQiOiI2NDIwODM0MjdlNWFiZGM5MDAxZmI2Y2YifQ==; session.sig=CXtY66iH39qSrP48bIBKPkmABmw","host":"localhost:32697","connection":"close"}
[Nest] 1  - 04/17/2025, 4:48:17 PM   DEBUG [PaymentsController] Body: {"event":"payment_intent.succeeded"}
[Nest] 1  - 04/17/2025, 4:48:17 PM   DEBUG [PaymentsService] Processing webhook in service
[Nest] 1  - 04/17/2025, 4:48:17 PM   ERROR [PaymentsService] Missing stripe signature
[Nest] 1  - 04/17/2025, 4:48:17 PM   DEBUG [PaymentsController] Webhook processed successfully
```

### 12.13 Ver el contenido de un secret en el cluster

- Para editar un secret podemos borrarlo y crear uno nuevo.
- Pero, en este caso, vamos a ver el contenido del secret de payments-ms.
- Vamos a obtener el listado de secrets.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
kubectl get secrets
NAME                                           TYPE                             DATA   AGE
auth-ms-secrets                                Opaque                           2      161m
gcr-json-key                                   kubernetes.io/dockerconfigjson   1      23h
orders-ms-secrets                              Opaque                           1      3h14m
payments-ms-secrets                            Opaque                           2      112m
sh.helm.release.v1.nestjs-microservicios.v17   helm.sh/release.v1               1      132m
sh.helm.release.v1.nestjs-microservicios.v18   helm.sh/release.v1               1      107m
sh.helm.release.v1.nestjs-microservicios.v19   helm.sh/release.v1               1      103m
sh.helm.release.v1.nestjs-microservicios.v20   helm.sh/release.v1               1      79m
sh.helm.release.v1.nestjs-microservicios.v21   helm.sh/release.v1               1      46m
sh.helm.release.v1.nestjs-microservicios.v22   helm.sh/release.v1               1      42m
sh.helm.release.v1.nestjs-microservicios.v23   helm.sh/release.v1               1      23m
sh.helm.release.v1.nestjs-microservicios.v24   helm.sh/release.v1               1      18m
sh.helm.release.v1.nestjs-microservicios.v25   helm.sh/release.v1               1      16m
sh.helm.release.v1.nestjs-microservicios.v26   helm.sh/release.v1               1      8m50s                              2      11m
```

- Vamos a obtener el contenido del secret auth-ms-secrets.

```bash
~/Training/microservices/nestjs-microservicios/02-Products-App/k8s/nestjs-microservicios$
kubectl get secrets auth-ms-secrets -o yaml
apiVersion: v1
data:
  AUTH_DATABASE_URL: bW9uZ29kYitzcnY6LyXXXXXXXXXXXXXXXXXLnE2ZmYzY3EubW9uZ29kYi5uZXQvQXV0aERC
  JWT_SECRET: Q0JtMmI2DDDDDDDDDDDDDdxRGJVbXhBSmw=
kind: Secret
metadata:
  creationTimestamp: "2025-04-17T14:13:35Z"
  name: auth-ms-secrets
  namespace: default
  resourceVersion: "65737"
  uid: a9f169f6-73ea-4d00-8978-da3ec12cc22e
type: Opaque
```

- El valor está codificado en base64. Por lo tanto, podemos decodificarlo para ver el contenido.
