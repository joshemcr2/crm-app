# Guía de Despliegue en Producción — CRM Operativo (Laravel 13 + React)

## 1. Requisitos del servidor

**Recomendado para portafolio / producción ligera:** VPS en Hetzner (CX22) o DigitalOcean (Droplet 2vCPU/4GB) con **Ubuntu 24.04 LTS**.

| Componente | Versión recomendada |
|---|---|
| PHP | 8.3+ (requerido por Laravel 13) |
| MySQL | 8.0+ |
| Nginx | 1.24+ |
| Node.js | 20 LTS (para compilar Vite/React) |
| Redis | 7+ (colas y caché) |
| Composer | 2.x |
| Supervisor | para mantener vivos los Queue Workers |

### Instalación base de paquetes

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx mysql-server redis-server supervisor unzip git curl

# PHP 8.3 + extensiones necesarias
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update
sudo apt install -y php8.3-fpm php8.3-mysql php8.3-mbstring php8.3-xml \
  php8.3-curl php8.3-zip php8.3-bcmath php8.3-redis php8.3-gd

# Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

---

## 2. Configuración del entorno (.env de producción)

```env
APP_NAME="CRM Operativo"
APP_ENV=production
APP_KEY=                      # se genera con php artisan key:generate
APP_DEBUG=false                # CRÍTICO: nunca true en producción
APP_URL=https://crm.tudominio.com

LOG_CHANNEL=stack
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=crm_operativo
DB_USERNAME=crm_user
DB_PASSWORD=                   # contraseña fuerte, nunca en el repositorio

SESSION_DRIVER=redis
CACHE_STORE=redis
QUEUE_CONNECTION=redis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

# Sanctum SPA (cookies same-site para el frontend React)
SANCTUM_STATEFUL_DOMAINS=crm.tudominio.com
SESSION_DOMAIN=.tudominio.com
CORS_ALLOWED_ORIGINS=https://crm.tudominio.com

# Firma HMAC del webhook de captura externa de leads (genera uno con `openssl rand -hex 32`)
WEBHOOK_SIGNING_SECRET=

# Mailgun
MAIL_MAILER=mailgun
MAILGUN_DOMAIN=mg.tudominio.com
MAILGUN_SECRET=

# Twilio
TWILIO_SID=
TWILIO_TOKEN=
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

**Reglas de seguridad clave:**
- El archivo `.env` **nunca** se sube a Git (verifica que está en `.gitignore`).
- `APP_DEBUG=false` evita filtrar stack traces con rutas del servidor.
- Genera `APP_KEY` una sola vez por entorno: `php artisan key:generate --force`.
- Usa un usuario MySQL con permisos limitados solo a la base `crm_operativo` (no root).

---

## 3. Automatización de despliegue

### 3.1 Clonado y dependencias

```bash
cd /var/www
sudo git clone git@github.com:tu-usuario/crm-operativo.git
cd crm-operativo

composer install --optimize-autoloader --no-dev
npm ci
npm run build            # compila React/Tailwind vía Vite a public/build
```

### 3.2 Migraciones y optimización de caché

```bash
php artisan migrate --force
php artisan db:seed --class=CrmDemoSeeder --force   # opcional, datos demo del portafolio

php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
```

### 3.3 Permisos

```bash
sudo chown -R www-data:www-data /var/www/crm-operativo
sudo chmod -R 755 /var/www/crm-operativo/storage /var/www/crm-operativo/bootstrap/cache
```

### 3.4 Queue Workers con Supervisor (envío async de emails/WhatsApp)

Crea `/etc/supervisor/conf.d/crm-worker.conf`:

```ini
[program:crm-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/crm-operativo/artisan queue:work redis --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/crm-operativo/storage/logs/worker.log
stopwaitsecs=3600
```

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start crm-worker:*
```

### 3.5 Script de despliegue continuo (opcional)

```bash
#!/bin/bash
# deploy.sh
set -e
cd /var/www/crm-operativo
git pull origin main
composer install --optimize-autoloader --no-dev
npm ci && npm run build
php artisan migrate --force
php artisan config:cache && php artisan route:cache && php artisan view:cache
sudo supervisorctl restart crm-worker:*
echo "✅ Despliegue completado"
```

---

## 4. Seguridad: Nginx + SSL (Let's Encrypt)

### 4.1 Bloque de servidor Nginx (`/etc/nginx/sites-available/crm-operativo`)

```nginx
server {
    listen 80;
    server_name crm.tudominio.com;
    root /var/www/crm-operativo/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";

    index index.php;
    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/crm-operativo /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 4.2 Certificado SSL con Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d crm.tudominio.com
# Certbot reescribe automáticamente el bloque server a puerto 443 y agrega HTTP -> HTTPS
sudo certbot renew --dry-run   # verifica la renovación automática
```

### 4.3 Firewall básico

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 4.4 Checklist final de seguridad

- [ ] `.env` fuera del control de versiones y con permisos `600`.
- [ ] `APP_DEBUG=false` y `APP_ENV=production`.
- [ ] Contraseñas de MySQL, Mailgun y Twilio rotadas respecto a desarrollo.
- [ ] Rate limiting en rutas de autenticación (`throttle:6,1` en Laravel).
- [ ] Backups automáticos de MySQL (ej. `mysqldump` diario vía cron + almacenamiento externo tipo S3/Spaces).
- [ ] HTTPS forzado y HSTS activo.
- [ ] Monitoreo de colas (`php artisan queue:work` vivo vía Supervisor) y logs (`storage/logs/laravel.log`).

---

Con esto, el CRM queda desplegado, con colas asíncronas funcionando para las integraciones de Mailgun/Twilio, caché optimizada y tráfico servido de forma segura sobre HTTPS.
