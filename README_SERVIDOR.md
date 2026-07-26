# Manual del Becario CDMX — paquete para servidor propio

Este paquete contiene tres aplicaciones:

- `apps/portada-saldo`: portada, acceso demostrativo y consulta de saldo.
- `apps/utopias`: geovisualizador de UTOPÍAS.
- `apps/centros`: geovisualizador de PILARES y bibliotecas.

## Requisitos

- Servidor Linux Ubuntu 22.04 o posterior.
- Node.js 22.13 o posterior.
- npm.
- Nginx.
- PM2.
- Tres registros DNS: `tudominio.mx`, `utopias.tudominio.mx` y
  `centros.tudominio.mx`, todos dirigidos a la IP del servidor.

## 1. Configura los dominios de los botones

Entra a `apps/portada-saldo`, duplica `.env.example` como `.env.production` y
reemplaza `tudominio.mx` por tu dominio real:

```env
VITE_UTOPIAS_URL=https://utopias.tudominio.mx
VITE_CENTROS_URL=https://centros.tudominio.mx
```

## 2. Instala y compila

Desde la carpeta principal:

```bash
cd apps/portada-saldo
npm ci
npm run build

cd ../utopias
npm ci
npm run build

cd ../centros
npm ci
npm run build

cd ../..
sudo npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

Ejecuta también el comando adicional que muestre `pm2 startup`.

## 3. Configura Nginx

Copia `deploy/nginx/manual-becario.conf` a:

```text
/etc/nginx/sites-available/manual-becario.conf
```

Reemplaza todas las apariciones de `tudominio.mx`. Después:

```bash
sudo ln -s /etc/nginx/sites-available/manual-becario.conf /etc/nginx/sites-enabled/manual-becario.conf
sudo nginx -t
sudo systemctl reload nginx
```

## 4. Activa HTTPS

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tudominio.mx -d www.tudominio.mx -d utopias.tudominio.mx -d centros.tudominio.mx
```

HTTPS es obligatorio para que los navegadores permitan la geolocalización.

## Acceso demostrativo al saldo

- Usuario: `usuario`
- Contraseña: `admin`

Este acceso y el saldo son exclusivamente demostrativos. No deben usarse como
autenticación real ni conectarse a información bancaria o personal. Para
producción se requiere autenticación del lado del servidor, cifrado, control de
sesiones, bitácora de accesos y conexión autorizada al padrón institucional.

## Actualizar después de editar

Compila la aplicación modificada y reinicia su proceso:

```bash
npm run build
pm2 restart manual-becario-portada
```

Usa `manual-becario-utopias` o `manual-becario-centros` según corresponda.
