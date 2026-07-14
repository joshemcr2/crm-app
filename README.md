# CRM Operativo — Laravel 13 + React/Tailwind

Proyecto de portafolio: CRM operativo con pipeline Kanban, automatizaciones tipo
workflow, e integraciones con Mailgun (email) y Twilio (WhatsApp/SMS).

Este repositorio contiene el **proyecto Laravel completo** (todo el código fuente:
`composer.json`, `artisan`, `bootstrap/`, `config/`, migraciones, modelos,
controladores, servicios, y el frontend en React). No incluye `vendor/` ni
`node_modules/` — eso es normal en cualquier repositorio PHP/Node, se generan
al instalar las dependencias con Composer y npm (paso 2 de abajo).

---

## Stack

- **Backend:** Laravel 13, PHP 8.3, Sanctum (auth SPA), colas en base de datos (o Redis).
- **Frontend:** React 18 + Tailwind CSS + `@dnd-kit` (drag-and-drop), compilado con Vite.
- **Base de datos:** SQLite por defecto en local (cero configuración), MySQL en producción.
- **Arquitectura:** Controladores delgados → Services (lógica de negocio) → Models.
  Los jobs en cola (`app/Jobs`) desacoplan las integraciones externas del ciclo
  request/response, para que mover una tarjeta del Kanban sea instantáneo.

---

## 1. Puesta en marcha en LOCAL (paso a paso, desde cero)

### Requisitos previos en tu Mac

```bash
php -v      # necesitas PHP 8.3+
composer -V # Composer 2.x
node -v     # Node 20+
npm -v
```

Si te falta alguno, instálalo con Homebrew:

```bash
brew install php composer node
```

### 1.1 Instalar dependencias

Desde la carpeta del proyecto (`crm-app/`):

```bash
composer install
npm install
```

Esto descarga Laravel, Sanctum, y todo lo demás definido en `composer.json`,
y React/Tailwind/@dnd-kit definido en `package.json`. **Este paso es obligatorio
y es el que faltaba en tu primer intento** (el zip anterior no traía
`composer.json`, por eso Composer no encontraba nada que instalar).

### 1.2 Configurar el entorno

```bash
cp .env.example .env
php artisan key:generate
```

El `.env.example` ya viene configurado con **SQLite** para que no tengas que
instalar ni levantar MySQL en local. El archivo `database/database.sqlite`
ya existe vacío en el repo (si por algún motivo no existe, créalo con
`touch database/database.sqlite`).

### 1.3 Migrar y sembrar datos de prueba

```bash
php artisan migrate --seed
```

Esto crea todas las tablas (`pipelines`, `stages`, `leads`, `interactions`,
`workflows`, más las de Laravel: `users`, `sessions`, `jobs`, etc.) y siembra:

- 1 pipeline llamado "Pipeline Comercial" con las 6 etapas pedidas.
- 3 leads de ejemplo por columna (18 en total).
- Un usuario demo: **demo@crm-operativo.test / password**.

### 1.4 Levantar los 3 procesos necesarios

Necesitas **tres terminales abiertas a la vez**:

```bash
# Terminal 1 — servidor Laravel (backend)
php artisan serve

# Terminal 2 — Vite (compila y sirve React con hot-reload)
npm run dev

# Terminal 3 — Queue worker (IMPRESCINDIBLE para Mailgun/Twilio)
php artisan queue:work
```

Abre **http://localhost:8000** en el navegador. Verás la SPA de React
servida por Laravel, con el sidebar, el Cmd+K, y el tablero Kanban ya
cargado con los datos de prueba.

> **¿Por qué 3 terminales?** Laravel sirve el HTML/API, Vite compila el
> JS/CSS en caliente mientras editas, y el queue worker procesa en segundo
> plano los jobs `NotifyWonDeal` / `DispatchWorkflowActions` (si no lo
> arrancas, los emails/WhatsApp quedan encolados pero nunca se envían).

### 1.5 Autenticarte

El frontend de ejemplo (`resources/js/app.jsx`) carga directamente el
tablero sin pantalla de login para simplificar la demo. Para probar los
endpoints de autenticación puedes usar `curl` o Postman:

```bash
curl -c cookies.txt http://localhost:8000/sanctum/csrf-cookie
curl -b cookies.txt -c cookies.txt -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" -H "Accept: application/json" \
  -d '{"email":"demo@crm-operativo.test","password":"password"}'
```

---

## 2. Flujo clave: mover una tarjeta del Kanban

1. El usuario arrastra una tarjeta en `KanbanBoard.jsx` → `onDragEnd`.
2. El frontend llama `PATCH /api/leads/{lead}/move` con `{ stage_id, position }`.
3. `KanbanController::move()` delega en `KanbanBoardService::moveLead()`.
4. El servicio reindexa posiciones, registra la interacción de cambio de etapa,
   dispara `WorkflowEngineService` (automatizaciones configurables) y, si la
   nueva etapa es de tipo `won`, encola `NotifyWonDeal` para avisar al cliente
   por email y WhatsApp **sin bloquear la respuesta HTTP**.

## 3. Flujo clave: captura externa de leads (formulario web / API)

1. Un formulario externo hace `POST /api/webhooks/lead-capture`, firmado con
   HMAC-SHA256 en el header `X-CRM-Signature` (usando `WEBHOOK_SIGNING_SECRET`
   del `.env` como clave).
2. `VerifyWebhookSignature` valida la firma antes de llegar al controlador.
3. `WebhookController` delega en `WorkflowEngineService::createLeadFromExternalTrigger()`.
4. Se crea el `Lead` en la primera etapa del pipeline y se dispara el evento
   `lead.created`, que ejecuta los workflows configurados en la tabla
   `workflows` (por ejemplo, crear una tarea de seguimiento automática).

Ejemplo real para probar el webhook desde tu terminal:

```bash
SECRET="cambia-esto-por-un-secreto-largo-y-aleatorio"   # el mismo del .env
BODY='{"name":"Laura Gómez","company":"Acme","email":"laura@acme.com","source":"web_form"}'
SIGNATURE=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$SECRET" | sed 's/^.* //')

curl -X POST http://localhost:8000/api/webhooks/lead-capture \
  -H "Content-Type: application/json" \
  -H "X-CRM-Signature: $SIGNATURE" \
  -d "$BODY"
```

---

## 4. Estructura del proyecto

```
crm-app/
├── app/
│   ├── Http/
│   │   ├── Controllers/Api/
│   │   │   ├── AuthController.php       # login/registro/logout (Sanctum SPA)
│   │   │   ├── LeadController.php       # CRUD completo de leads
│   │   │   ├── InteractionController.php# historial de interacciones
│   │   │   ├── KanbanController.php     # cambio de estado del Kanban
│   │   │   └── WebhookController.php    # captura externa de leads
│   │   ├── Middleware/VerifyWebhookSignature.php
│   │   ├── Requests/{StoreLeadRequest,UpdateLeadRequest,MoveLeadRequest}.php
│   │   └── Resources/{LeadResource,StageResource,InteractionResource}.php
│   ├── Jobs/
│   │   ├── NotifyWonDeal.php            # notifica Mailgun+Twilio al pasar a "Ganado"
│   │   └── DispatchWorkflowActions.php  # ejecuta acciones de un Workflow
│   ├── Models/
│   │   ├── User.php, Lead.php, Pipeline.php, Stage.php
│   │   └── Interaction.php, Workflow.php, WorkflowLog.php
│   └── Services/
│       ├── KanbanBoardService.php       # mueve leads, reindexa posiciones
│       ├── WorkflowEngineService.php    # motor de automatizaciones (triggers)
│       ├── CrmIntegrationService.php    # fachada de notificaciones
│       ├── Contracts/NotificationChannel.php
│       └── Notifications/{MailgunChannel,TwilioChannel}.php
├── bootstrap/app.php                    # rutas, middleware, Sanctum stateful
├── config/                              # app, database, sanctum, cors, mail, queue...
├── database/
│   ├── migrations/                      # users, pipelines, stages, leads, interactions, workflows...
│   ├── factories/{UserFactory,LeadFactory}.php
│   └── seeders/{DatabaseSeeder,CrmDemoSeeder}.php
├── resources/
│   ├── css/app.css
│   ├── js/
│   │   ├── app.jsx                      # entry point de React
│   │   ├── lib/api.js                   # cliente HTTP con CSRF de Sanctum
│   │   └── components/
│   │       ├── AppShell.jsx             # sidebar colapsable + Cmd+K
│   │       └── kanban/KanbanBoard.jsx   # tablero drag-and-drop
│   └── views/app.blade.php              # shell HTML que monta la SPA
├── routes/{web.php,api.php,console.php}
├── public/{index.php,.htaccess}
├── .env.example
├── composer.json
├── package.json
├── vite.config.js
├── tailwind.config.js
└── DEPLOYMENT.md                        # guía paso a paso de despliegue en producción
```

---

## 5. Despliegue en producción

Consulta **`DEPLOYMENT.md`** para la guía completa: VPS Ubuntu, `.env` de
producción con MySQL, Nginx + SSL (Let's Encrypt), y Supervisor para
mantener vivos los queue workers (necesarios para que Mailgun/Twilio
funcionen de forma asíncrona).

---

## 6. Notas honestas sobre lo que falta para "producción real"

Este proyecto está pensado como pieza de portafolio, lista para levantar y
enseñar. Antes de usarlo con clientes reales, te recomiendo añadir:

- **Policies de autorización** (hoy `authorize()` devuelve `true` en los
  Form Requests; en producción real deberías validar que el usuario
  autenticado tiene permiso sobre ese Lead/Pipeline).
- **Tests automatizados** (Feature tests para el flujo de mover tarjetas
  y para el webhook de captura de leads).
- **Panel de administración de `workflows`** — hoy se crean directamente
  en base de datos o vía tinker; una automatización de portafolio de gran
  impacto sería una UI para crear estas reglas sin tocar código.
- **Rate limiting específico** en el endpoint de webhook además de la
  firma HMAC.
