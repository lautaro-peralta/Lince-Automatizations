# Cuestiones legales — Lince

Hoja de ruta legal integral del emprendimiento **Lince Automatizaciones**
(Rosario, Santa Fe, Argentina): qué obligaciones existen, por qué aplican a
este negocio en particular y en qué orden conviene resolverlas.

> ⚠️ **Este documento no es asesoramiento legal.** Es un relevamiento de
> trabajo para ordenar el emprendimiento. Antes de firmar contratos, inscribir
> la sociedad o publicar los textos legales definitivos, validarlo con un
> abogado matriculado y un contador (idealmente de Santa Fe, por los tributos
> locales). La normativa citada puede haber cambiado desde la fecha de este
> documento.

## Índice

1. [Forma jurídica](#1-forma-jurídica)
2. [Impuestos e inscripciones](#2-impuestos-e-inscripciones)
3. [Protección de datos personales (Ley 25.326)](#3-protección-de-datos-personales-ley-25326)
4. [Defensa del consumidor y contratación a distancia](#4-defensa-del-consumidor-y-contratación-a-distancia)
5. [Comunicaciones comerciales (WhatsApp, email, teléfono)](#5-comunicaciones-comerciales-whatsapp-email-teléfono)
6. [Contratos con clientes](#6-contratos-con-clientes)
7. [Propiedad intelectual y marca](#7-propiedad-intelectual-y-marca)
8. [Sitio web y app móvil](#8-sitio-web-y-app-móvil)
9. [Integraciones de terceros](#9-integraciones-de-terceros)
10. [Equipo de trabajo](#10-equipo-de-trabajo)
11. [Lince Teams (repo aparte)](#11-lince-teams-repo-aparte)
12. [Checklist priorizado](#12-checklist-priorizado)

---

## 1. Forma jurídica

**Situación típica de arranque:** persona humana (o varias) prestando
servicios. Opciones, de menor a mayor formalidad:

| Forma | Cuándo conviene | Notas |
|-------|-----------------|-------|
| **Monotributo** (persona humana) | Arranque, facturación baja, un solo titular | Alta simple y barata en ARCA. Responsabilidad **ilimitada**: el patrimonio personal responde por deudas del negocio. Si hay dos socios de hecho, cada uno factura por su lado (incómodo para repartir ingresos). |
| **Sociedad de hecho / SAS informal entre socios** | Nunca — evitar | La "sociedad de la Sección IV" deja a los socios con responsabilidad mancomunada y reglas por defecto; mejor formalizar. |
| **SAS** (Ley 27.349) | Cuando hay más de un socio o clientes que exigen facturar como empresa | Responsabilidad limitada al capital, estatuto modelo, capital mínimo bajo (2 salarios mínimos). En Santa Fe se inscribe ante el **Registro Público** (IGPJ Santa Fe). Requiere contador para balances anuales. |
| **SRL** | Alternativa clásica a la SAS; algunos bancos/clientes la prefieren | Trámite algo más pesado que la SAS en Santa Fe. |

**Recomendación práctica:** empezar como monotributista mientras se validan
los primeros clientes; constituir **SAS** cuando (a) haya más de un socio con
ingresos que repartir, (b) un contrato importante exija responsabilidad
limitada, o (c) la facturación se acerque al tope de monotributo.

Mientras se opere como persona humana, el nombre "Lince Automatizaciones" es
un **nombre de fantasía**: en facturas y contratos debe aparecer el nombre
real y CUIT del titular ("Juan Pérez, CUIT XX-XXXXXXXX-X, con nombre de
fantasía Lince Automatizaciones").

## 2. Impuestos e inscripciones

- **ARCA (ex AFIP):** alta en Monotributo (o Régimen General si se supera el
  tope). Actividad: servicios de consultoría/desarrollo de software
  (códigos 620100/620200/702091 según encuadre que defina el contador).
  **Facturación electrónica obligatoria** (factura C como monotributista) por
  Comprobantes en Línea o la API de facturación.
- **Ingresos Brutos (API Santa Fe):** inscripción provincial. Si hay clientes
  en otras provincias de forma habitual, evaluar **Convenio Multilateral**.
  Santa Fe tiene régimen simplificado para pequeños contribuyentes.
- **DReI (Rosario):** Derecho de Registro e Inspección municipal si hay local
  u oficina en Rosario; consultar encuadre cuando el trabajo es 100 % remoto
  desde el domicilio.
- **Clientes del exterior:** la exportación de servicios está exenta de IVA y
  tiene reglas cambiarias propias para el cobro de divisas; tratar con el
  contador antes de aceptar el primer cliente del exterior.
- **Facturar siempre**: cada plan cobrado (proyecto "Sistema" o abono
  "Acompañamiento") debe tener su factura. El plan "Diagnóstico" es gratuito y
  no genera obligación de facturar.

## 3. Protección de datos personales (Ley 25.326)

Es **el frente legal más importante del negocio**, porque Lince trata datos en
dos roles distintos:

### 3.1 Como responsable de tratamiento (datos propios)

Bases de datos que Lince decide y administra:

| Base | Datos | Dónde vive |
|------|-------|-----------|
| Leads / prospectos | nombre, email, teléfono, empresa, mensaje | Supabase (tabla `leads` / endpoint `/api/prospects`) |
| Clientes y facturación (Startup OS) | datos de contacto y comerciales de clientes | Supabase |
| Usuarios del panel | email, rol (`admin`/`socio`) | Supabase Auth |
| Conversaciones del chatbot demo | mensajes, estado de sesión | Supabase |

Obligaciones concretas:

- **Deber de información (art. 6):** al recolectar datos hay que informar
  finalidad, destinatarios, carácter obligatorio u optativo, consecuencias de
  no darlos, y los derechos de acceso/rectificación/supresión. → Se cumple con
  la **política de privacidad** publicada en `/legal/privacidad` y el aviso
  junto al formulario de contacto (ya implementados en `web/`).
- **Consentimiento (art. 5):** el envío voluntario del formulario, con la
  política a un clic, es la base del tratamiento de leads.
- **Calidad y proporcionalidad (art. 4):** pedir sólo lo necesario (el
  formulario actual pide el mínimo razonable: ✔).
- **Derechos ARCO (arts. 14-16):** responder pedidos de acceso en ≤10 días
  corridos (gratuito, a intervalos no inferiores a 6 meses) y de
  rectificación/supresión en ≤5 días hábiles. Canal: el email de contacto.
- **Registro Nacional de Bases de Datos (art. 21):** inscribir las bases ante
  la **AAIP** (trámite online y gratuito). Es una obligación formal vigente
  aunque de fiscalización laxa; conviene cumplirla al formalizar el negocio.
- **Seguridad (art. 9):** medidas alineadas con la Resolución AAIP 47/2018.
  El repo ya implementa varias (RLS en todas las tablas, service-role sólo en
  backend, validación server-side, CORS restringido, honeypot y rate-limit).
  Completar con: backups verificados, política de contraseñas/2FA en Supabase
  y Render, y registro de quién tiene acceso a producción.
- **Transferencia internacional (art. 12):** Supabase, Render y Cloudflare
  alojan datos fuera de Argentina (típicamente EE.UU., país **sin nivel
  adecuado** de protección declarado). Cobertura: (a) informarlo en la
  política de privacidad (hecho), y (b) apoyarse en los DPA estándar que estos
  proveedores ofrecen, que incorporan cláusulas contractuales de salvaguarda
  (los tres publican Data Processing Agreements aceptados al contratar).
  Guardar copia de esos DPA.

### 3.2 Como encargado de tratamiento (datos de los clientes)

Cuando Lince automatiza WhatsApp, reseñas o presupuestos de un cliente,
**trata datos personales de los clientes del cliente** (consumidores finales
del comercio). Ahí el responsable es el comercio y Lince es **encargado**
(art. 25 Ley 25.326). Obligaciones:

- Firmar con cada cliente un **anexo de tratamiento de datos** que limite el
  uso a las instrucciones del cliente, imponga confidencialidad y seguridad, y
  ordene devolver/destruir los datos al terminar. → Modelo en
  [`docs/legal/ANEXO-DATOS.md`](legal/ANEXO-DATOS.md).
- No reutilizar esos datos para fines propios (ni siquiera métricas públicas)
  sin acuerdo expreso.

## 4. Defensa del consumidor y contratación a distancia

- **¿Aplica la Ley 24.240?** Los clientes de Lince son comercios que integran
  el servicio a su actividad: en general **no** son consumidores finales y la
  relación es B2B (rige el Código Civil y Comercial). Pero si se llegara a
  vender a una persona humana como destinataria final (p. ej. un profesional
  independiente para uso mixto), la relación puede encuadrar como de consumo,
  con sus reglas de orden público.
- **Revocación a distancia (art. 34 LDC y arts. 1110-1116 CCyC):** en ventas a
  consumidores concluidas a distancia hay derecho de arrepentimiento de **10
  días corridos**. Los términos publicados en `/legal/terminos` ya lo
  contemplan para el caso en que aplique.
- **Botón de arrepentimiento (Res. 424/2020 SCI):** exige un enlace visible
  para revocar en sitios que **venden online a consumidores**. Hoy la web de
  Lince no tiene checkout (los precios son "a medida" y se contrata por
  propuesta), así que no sería exigible; **si algún día se vende un plan
  contratable online, hay que agregar el botón en la home**.
- **Publicidad y precios:** la landing aclara que los casos son ilustrativos
  con datos simulados (✔ en footer) y los términos aclaran que los planes
  publicados son orientativos y la oferta vinculante es la propuesta escrita.
  Evitar promesas de resultados cuantificados en la web sin respaldo (la
  publicidad integra el contrato, art. 8 LDC y 1103 CCyC).

## 5. Comunicaciones comerciales (WhatsApp, email, teléfono)

- **Prospección propia:** si se hacen llamadas o WhatsApp en frío a números de
  personas humanas, revisar el **Registro Nacional "No Llame" (Ley 26.951)**
  antes de contactar. El email en frío a empresas es tolerado, pero todo envío
  debe identificar al emisor y ofrecer **baja inmediata** (art. 27 Ley 25.326:
  derecho al retiro o bloqueo de bases con fines publicitarios).
- **Automatizaciones para clientes:** las campañas salientes que Lince monte
  para un cliente deben respetar lo mismo; conviene pactar en el contrato que
  el cliente garantiza tener el consentimiento/opt-in de su base (está en el
  modelo de contrato).
- **WhatsApp:** usar la **API oficial de WhatsApp Business (Meta)** para
  mensajes salientes; los mensajes proactivos requieren opt-in del
  destinatario y plantillas aprobadas según las políticas de Meta. Automatizar
  por vías no oficiales arriesga el bloqueo del número del cliente (y
  reclamos del cliente a Lince: cubrirlo en el contrato).

## 6. Contratos con clientes

Nada de trabajar "de palabra": cada proyecto debe tener **propuesta aceptada +
contrato firmado**. Modelos listos para adaptar:

| Documento | Archivo | Cuándo se usa |
|-----------|---------|---------------|
| Contrato de servicios de automatización | [`docs/legal/CONTRATO-SERVICIOS.md`](legal/CONTRATO-SERVICIOS.md) | Todo proyecto "Sistema" y abono "Acompañamiento" |
| Acuerdo de confidencialidad (NDA) | [`docs/legal/ACUERDO-CONFIDENCIALIDAD.md`](legal/ACUERDO-CONFIDENCIALIDAD.md) | Diagnóstico gratuito (se accede a datos del negocio antes de firmar contrato) |
| Anexo de tratamiento de datos | [`docs/legal/ANEXO-DATOS.md`](legal/ANEXO-DATOS.md) | Siempre que la automatización toque datos de clientes del cliente |

Puntos que el contrato resuelve (ver el modelo): alcance y entregables,
precio y forma de pago, plazos, propiedad intelectual de lo desarrollado,
dependencia de servicios de terceros, límites de responsabilidad, garantía y
soporte, confidencialidad, datos personales, rescisión y jurisdicción.

## 7. Propiedad intelectual y marca

- **Marca:** registrar "Lince Automatizaciones" (denominativa y logo) ante el
  **INPI** (Ley 22.362), al menos en clases de Niza **42** (software/servicios
  tecnológicos) y **35** (gestión/publicidad). "Lince" es palabra de uso común
  y hay riesgo de marcas homónimas: hacer búsqueda de antecedentes en INPI
  antes de invertir más en la marca. Hasta el registro, el uso genera sólo una
  protección precaria (marca de hecho).
- **Software propio:** el código está protegido por la **Ley 11.723** desde su
  creación (art. 1 incluye programas de computación). El depósito en la DNDA
  es opcional pero da fecha cierta; considerarlo para el core.
- **Cesión vs. licencia:** decidir por contrato qué recibe cada cliente. El
  modelo de contrato usa el esquema recomendado: el cliente recibe **licencia
  amplia sobre lo configurado para él** y Lince retiene la titularidad de
  componentes, plantillas y know-how reutilizables. Toda cesión de derechos
  debe ser **expresa y por escrito** (arts. 51 y ss. Ley 11.723).
- **Repos de GitHub:** sin archivo `LICENSE`, el código publicado queda "todos
  los derechos reservados" por defecto — nadie puede reutilizarlo legalmente,
  que es lo deseado para código de negocio. Decisión consciente: si algún día
  se quiere abrir una pieza, elegir licencia (MIT/AGPL) en ese momento.
- **Dependencias open source:** el stack (SvelteKit, Express, Supabase JS,
  etc.) es MIT/Apache — uso comercial permitido sin obligación de abrir el
  código propio. Mantener los avisos de copyright que exigen esas licencias
  (los `node_modules`/bundles ya los conservan). Evitar incorporar
  dependencias GPL/AGPL en el código que se entrega a clientes sin revisarlo.

## 8. Sitio web y app móvil

Implementado en este repo (rama de trabajo):

- **Política de privacidad** → `/legal/privacidad`
  (`web/src/routes/legal/privacidad/`). Incluye el aviso de la AAIP exigido
  por la Disposición DNPDP 10/2008 y la gratuidad semestral del acceso
  (art. 14 inc. 3).
- **Términos y condiciones** → `/legal/terminos`
  (`web/src/routes/legal/terminos/`).
- **Enlaces en el footer** y **aviso de privacidad junto al formulario** de
  contacto.
- **Cookies:** el sitio no usa cookies de seguimiento ni analítica de
  terceros; sólo `localStorage` para preferencias (tema, idioma) y el límite
  local de envíos del formulario. Con este perfil no hace falta banner de
  cookies; **si se agrega analítica o píxeles de marketing, habrá que sumar
  aviso/banner y actualizar la política**.

Pendiente al publicar la app móvil:

- **Google Play:** URL pública de política de privacidad + formulario **Data
  Safety** coherente con ella; si la app permite crear cuenta, exige un
  **flujo de eliminación de cuenta** accesible desde la app y desde una URL
  web.
- **App Store:** etiquetas de privacidad (App Privacy) + misma exigencia de
  **eliminación de cuenta in-app** (guideline 5.1.1(v)).
- Hoy las cuentas del panel las crea un admin (no hay registro público), lo
  que simplifica ambos formularios, pero la política de privacidad ya cubre a
  los usuarios del panel por si las tiendas la revisan.

## 9. Integraciones de terceros

Cada integración usada en producción implica aceptar términos que obligan al
negocio:

- **Supabase / Render / Cloudflare:** aceptar y archivar sus DPA (ver §3.1).
  Revisar límites de los planes gratuitos: para datos de clientes en
  producción conviene plan pago con SLA.
- **Google (Drive, reseñas):** usar APIs oficiales con OAuth; **no scrapear**
  reseñas ni resultados (viola los ToS de Google y expone a bloqueo). Para
  reseñas usar la API de Google Business Profile con la cuenta del cliente.
- **Meta/WhatsApp:** ver §5.
- **Mercado Pago u otro cobro online (futuro):** sus términos + emitir
  factura por cada cobro; si se vende online a consumidores se activa el botón
  de arrepentimiento (§4).
- **Proveedores de IA (si el chatbot usa un LLM externo):** no enviar datos
  personales de clientes finales sin cubrirlo en el anexo de datos y en la
  política del cliente; preferir proveedores con DPA y sin entrenamiento sobre
  los datos enviados.

## 10. Equipo de trabajo

- **Socios:** mientras no haya SAS, firmar al menos un **acuerdo de socios**
  simple (porcentajes, aportes, qué pasa si alguien se va, titularidad del
  código y la marca). Evita el conflicto clásico de las startups.
- **Colaboradores externos:** contrato de servicios con monotributistas que
  incluya **cesión de PI de lo que desarrollen** y confidencialidad. Ojo con
  el encuadre: exclusividad + horario + subordinación = riesgo de que se
  considere **relación laboral encubierta** (LCT 20.744) con multas; mantener
  la relación genuinamente autónoma o registrar el empleo.
- **Primer empleado:** alta temprana en ARCA, ART y seguro de vida
  obligatorio; presupuestar cargas sociales (~50 % sobre el bruto). CCT
  aplicable a definir con el contador (posiblemente UTSPRA/Comercio según
  actividad).

## 11. Lince Teams (repo aparte)

El repo [`lince-teams`](https://github.com/lautaro-peralta/lince-teams) tiene
su propio análisis legal en su `LEGAL.md`: roles de responsable/encargado en
despliegues autoalojados, consentimiento para grabación y transcripción de
voz, licencias de dependencias (Whisper/FastAPI) y estado de licencia del
propio repo. Lo esencial: **quien despliega Teams es el responsable del
tratamiento**; cuando Lince lo opere para un cliente, cubrirlo con el anexo de
datos (§3.2).

## 12. Checklist priorizado

**Ya resuelto en el código (esta rama):**

- [x] Política de privacidad pública (`/legal/privacidad`)
- [x] Términos y condiciones (`/legal/terminos`)
- [x] Enlaces legales en el footer + aviso en el formulario de contacto
- [x] Modelos de contrato, NDA y anexo de datos (`docs/legal/`)
- [x] Análisis legal de Lince Teams (repo `lince-teams`, `LEGAL.md`)

**Antes de facturar el primer peso:**

- [ ] Alta en ARCA (monotributo) + Ingresos Brutos Santa Fe (+ DReI si aplica)
- [ ] Facturación electrónica configurada
- [ ] Reemplazar los placeholders de contacto (teléfono `+54 9 341 000 0000`)
      y unificar el email de contacto en web y documentos

**Antes del primer cliente con datos reales:**

- [ ] Firmar NDA en el diagnóstico y contrato + anexo de datos en el proyecto
- [ ] Aceptar/archivar DPA de Supabase, Render y Cloudflare
- [ ] 2FA en Supabase/Render/Cloudflare/GitHub y registro de accesos

**Al formalizar (primeros meses):**

- [ ] Acuerdo de socios (o constitución de SAS si ya hay dos socios activos)
- [ ] Búsqueda de antecedentes y solicitud de marca en INPI (clases 35 y 42)
- [ ] Inscripción de bases de datos ante la AAIP
- [ ] Revisión de todos los modelos por abogado/contador

**Al lanzar cobros online o la app en tiendas:**

- [ ] Botón de arrepentimiento en la home (si hay venta online a consumidores)
- [ ] Data Safety (Play) / App Privacy (App Store) + flujo de borrado de cuenta
- [ ] Banner/aviso de cookies si se agrega analítica o marketing
