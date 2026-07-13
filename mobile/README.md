# Lince — App móvil (iOS + Android)

Shell nativo de [Capacitor](https://capacitorjs.com) que carga el origen
unificado de producción (`https://lince-automate.com.ar`), donde viven las
tres herramientas con **un solo login** (Supabase):

- **Panel** (`/admin`) — CRM: resumen, leads, presupuestos, reseñas.
- **Startup OS** (`/startup-os/`) — ERP: gastos, facturación, suscripciones, clientes, churn, anuncios, OKRs, roadmap, tokens MCP.
- **Teams** (`/teams/`) — kanban táctil, pizarra en tiempo real, transcripciones de voz (micrófono nativo), integraciones GitHub/Drive.

Como la app carga el mismo origen que el navegador, **todas las funciones e
integraciones existen desde el día uno** y cada deploy web actualiza la app
sin recompilarla. Cuando corre dentro del shell (User-Agent `LinceApp`), las
webs cargan `web/static/app-shell.js`: barra inferior para saltar entre las
tres apps, botón atrás de Android, status bar acorde al tema y vuelta a la
última app usada.

## Bajar e instalar el APK (Android)

1. Entrá a **Actions → Mobile Android APK** en GitHub y abrí el último run
   verde (o lanzalo con **Run workflow**; podés pasar otra URL de servidor).
2. Bajá el artifact **lince-app-release** y pasá el `app-release.apk` al
   teléfono.
3. Abrilo en el teléfono y permití "instalar apps de origen desconocido"
   para el navegador/gestor de archivos cuando lo pida.

Las versiones nuevas **instalan encima** de la anterior (misma firma y
`versionCode` creciente por número de run). No hace falta desinstalar.

## iOS (TestFlight)

Requiere una Mac con Xcode y una cuenta
[Apple Developer](https://developer.apple.com) (USD 99/año).

```bash
cd mobile
npm ci
npx cap sync ios
npx cap open ios     # abre Xcode
```

En Xcode:

1. En **App → Signing & Capabilities**, elegí tu *Team* (deja que Xcode
   gestione el provisioning). El bundle ID es `ar.com.linceautomate.app`.
2. Seleccioná **Any iOS Device** y **Product → Archive**.
3. En el organizer: **Distribute App → TestFlight & App Store → Upload**.
4. En [App Store Connect](https://appstoreconnect.apple.com) creá la app
   (mismo bundle ID), esperá que procese el build y agregá a tu equipo como
   testers internos de TestFlight (hasta 100, sin revisión de Apple).

Para probar rápido en un dispositivo propio sin cuenta paga: conectá el
iPhone y dale **Run** desde Xcode (firma personal gratuita, expira a los
7 días).

## Compilar localmente (Android)

Requiere JDK 21 y Android SDK (o Android Studio).

```bash
cd mobile
npm ci
npm run apk                       # cap sync + gradlew assembleRelease
# APK en android/app/build/outputs/apk/release/app-release.apk
```

Para abrirlo en Android Studio: `npm run open:android`.

## Cambiar el servidor (staging / pruebas)

La URL de producción está fija en `capacitor.config.ts`. Para compilar una
variante que apunte a otro servidor:

```bash
CAP_SERVER_URL=https://staging.midominio.com npx cap sync
```

En CI: **Run workflow** con el campo `server_url`. El servidor debe servir el
mismo stack (mismo origen para las tres apps + `/auth-config`).

## Íconos y splash

Se generan desde `assets/` con [@capacitor/assets](https://github.com/ionic-team/capacitor-assets):

```bash
npm run assets
```

- `assets/icon-foreground.png` — rombos con aire extra (zona segura del
  adaptive icon de Android).
- `assets/icon-background.png` / colores `#F7F5F0` (claro) y `#11140E`
  (oscuro) — fondo crema/carbón del design system.
- `assets/icon-only.png` — ícono iOS/legacy (rombos sobre crema).
- `assets/logo(.dark).png` — splash.

Los recursos generados (`android/.../res`, `ios/.../Assets.xcassets`) se
commitean.

## Permisos declarados

| Permiso | Para qué |
|---|---|
| Android `RECORD_AUDIO` + `MODIFY_AUDIO_SETTINGS` | Grabación de voz en Teams → Transcripciones (getUserMedia dentro del WebView). |
| iOS `NSMicrophoneUsageDescription` | Ídem. |
| iOS `NSCameraUsageDescription` | El selector de archivos ofrece "Sacar foto" al adjuntar imágenes/comprobantes; sin la clave, iOS cierra la app. |

Sin permiso de cámara en Android: los `<input type="file">` usan el selector
del sistema.

## Firma de Android (nota de seguridad)

`android/app/keystore/lince-internal.jks` está **commiteado a propósito**:
es una firma de distribución interna para que cualquier build (CI o local)
produzca APKs que se actualicen entre sí. Cualquiera con acceso al repo puede
firmar "como Lince interno" — aceptable para un repo privado y una app que no
va a las tiendas. Para una firma propia, definí los secrets
`LINCE_KEYSTORE_FILE`, `LINCE_KEYSTORE_PASSWORD`, `LINCE_KEYSTORE_ALIAS` y
`LINCE_KEYSTORE_KEY_PASSWORD` (el workflow los usa si existen) y regenerá el
keystore con `keytool`.

## Cómo funciona (decisiones)

- **`server.url` remoto**: el WebView carga producción directo. Mismo origen
  ⇒ misma sesión de Supabase que el navegador, sin CORS ni auth aparte. La
  contra: sin conexión no hay app (se muestra `web/error.html`).
- **Arranque en `/admin`**: es el hub de login; con sesión activa, el shell
  te devuelve a la última app usada.
- **Barras finales en `/teams/` y `/startup-os/`**: el WebView de Android no
  sigue redirects 307/308 al re-pedir HTML; los enlaces internos ya las llevan.
- **Puente best-effort**: si `window.Capacitor` no aparece en la página
  remota, la barra inferior igual se muestra (detección por UA) y el botón
  atrás cae al comportamiento nativo por defecto.

## Problemas conocidos

| Síntoma | Causa probable / solución |
|---|---|
| Pantalla en blanco al abrir | Sin red o servidor caído → debería verse `error.html`; si no, revisá que la URL de `capacitor.config.ts` responda 200 en el teléfono. |
| Pantalla en blanco al navegar a Teams | Enlace sin barra final (`/teams`) → redirect 308 que el WebView no sigue. Usar `/teams/`. |
| No pide micrófono al grabar | Revocaste el permiso: Ajustes → Apps → Lince → Permisos → Micrófono. |
| "App no instalada" al actualizar | El APK viene de otra firma (cambiaste el keystore). Desinstalá e instalá de nuevo. |
| La barra inferior no aparece | Aparece solo con sesión iniciada. Si tampoco: el server no sirve `/app-shell.js` (deploy viejo del frontend). |
