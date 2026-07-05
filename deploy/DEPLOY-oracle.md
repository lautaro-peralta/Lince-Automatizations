# Levantar el backend (Express) en Oracle Cloud — Always Free

Guía para correr `api/` en una VM del tier gratuito de Oracle Cloud, detrás de
nginx con HTTPS. La VM **no se duerme** (a diferencia del free de Render): no hay
cold starts.

> Reemplazá `api.TU-DOMINIO.com` por tu subdominio real en todos los pasos.

---

## 1. Crear la instancia (Always Free)

1. Oracle Cloud Console → **Compute → Instances → Create instance**.
2. **Image & shape:**
   - Image: **Canonical Ubuntu 22.04**.
   - Shape: **VM.Standard.A1.Flex** (ARM, Always Free hasta 4 OCPU / 24 GB).
     Elegí 1 OCPU / 6 GB — sobra. *Si da "out of capacity", probá otra
     Availability Domain o caé al AMD `VM.Standard.E2.1.Micro` (1 GB).*
3. **SSH keys:** subí tu clave pública (o generá una y guardá la privada).
4. **Create.** Anotá la **Public IP** cuando arranque.

## 2. Abrir puertos en la red (Security List)

Por defecto Oracle solo deja pasar SSH (22). Hay que abrir 80 y 443:

1. **Networking → Virtual Cloud Networks →** tu VCN **→ Security Lists →**
   Default Security List.
2. **Add Ingress Rules** (una por puerto):
   - Source `0.0.0.0/0`, IP Protocol **TCP**, Destination Port **80**.
   - Source `0.0.0.0/0`, IP Protocol **TCP**, Destination Port **443**.

## 3. Entrar por SSH y abrir el firewall del SO

```bash
ssh ubuntu@<PUBLIC_IP>
```

La imagen de Ubuntu en Oracle trae reglas de iptables que bloquean todo menos
SSH. Abrí 80/443 también acá (paso que casi todos olvidan):

```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

## 4. Instalar Node y git

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git
node -v    # debería mostrar v20.x
```

## 5. Traer el código

El repo es privado: cloná con un **token de GitHub** (Settings → Developer
settings → Personal access tokens, con permiso `repo`) o con una deploy key.

```bash
sudo mkdir -p /opt/lince && sudo chown -R ubuntu:ubuntu /opt/lince
git clone https://github.com/lautaro-peralta/lince-automatizations.git /opt/lince
cd /opt/lince/api
npm ci --omit=dev
```

## 6. Variables de entorno

```bash
cp .env.example .env
nano .env
```

Completá al menos:

- `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API; la
  service-role es **secreta**).
- `FRONTEND_ORIGIN=https://TU-SITIO.com` (el origen del frontend; separá por
  comas si hay varios).
- `UPLOADS_PROVIDER=supabase` y `SUPABASE_RECEIPTS_BUCKET=receipts`.
- Lo demás (notificaciones, IA, n8n) es opcional.

## 7. Correr como servicio (systemd)

```bash
sudo cp /opt/lince/deploy/lince-api.service /etc/systemd/system/lince-api.service
sudo systemctl daemon-reload
sudo systemctl enable --now lince-api
sudo systemctl status lince-api          # active (running)
curl -s http://127.0.0.1:3000/health     # {"ok":true,"service":"lince-api",...}
```

## 8. HTTPS con nginx + Let's Encrypt

El frontend está en HTTPS, así que la API **también** tiene que estarlo (un sitio
https no puede llamar a una API http).

Primero, en tu DNS creá un registro **A**: `api.TU-DOMINIO.com → <PUBLIC_IP>`.
*(Si usás Cloudflare, dejá ese registro en **DNS only** / nube gris al menos para
emitir el certificado.)*

```bash
sudo apt-get install -y nginx certbot python3-certbot-nginx

# Copiar el reverse proxy (editá el server_name antes)
sudo cp /opt/lince/deploy/nginx-lince-api.conf /etc/nginx/sites-available/lince-api
sudo nano /etc/nginx/sites-available/lince-api      # poné tu api.TU-DOMINIO.com
sudo ln -s /etc/nginx/sites-available/lince-api /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# Emitir el certificado (agrega el bloque 443 y renueva solo)
sudo certbot --nginx -d api.TU-DOMINIO.com
```

Probá desde tu compu: `https://api.TU-DOMINIO.com/health`.

## 9. Apuntar el frontend a la API nueva

- **Panel admin** (Cloudflare Pages → Settings → Variables):
  `PUBLIC_API_URL=https://api.TU-DOMINIO.com` → redeploy.
- **Startup OS** (`web/static/startup-os/index.html`): en el bloque
  `CONFIGURACIÓN`, `const API_URL = 'https://api.TU-DOMINIO.com';`.
- **Supabase → Redirect URLs:** que estén `https://TU-SITIO.com/admin` y
  `https://TU-SITIO.com/startup-os/`.

## Actualizar el backend más adelante

```bash
cd /opt/lince && git pull
cd api && npm ci --omit=dev
sudo systemctl restart lince-api
```

## Solución de problemas

- **La API no responde desde afuera pero sí con `curl` local** → falta abrir el
  puerto: revisá el Security List (paso 2) **y** las reglas de iptables (paso 3).
  Son dos firewalls distintos; hacen falta los dos.
- **Subir un comprobante da 413** → `client_max_body_size` en el nginx (ya viene
  en 10m en el archivo provisto).
- **CORS bloqueado** → `FRONTEND_ORIGIN` en `.env` tiene que incluir el origen
  exacto del frontend, sin barra final.
- **Ver logs** → `journalctl -u lince-api -f`.
