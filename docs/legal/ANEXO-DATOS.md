# Modelo — Anexo de tratamiento de datos personales

> **Anexo II del contrato de servicios** ([`CONTRATO-SERVICIOS.md`](CONTRATO-SERVICIOS.md)).
> Se firma siempre que la automatización trate datos personales de clientes,
> contactos o proveedores del Cliente (mensajes de WhatsApp, reseñas,
> presupuestos, listas de contactos). Regula la relación **responsable
> (Cliente) – encargado (Prestador)** del art. 25 de la Ley 25.326. Adaptar
> los `[corchetes]` y validar con un abogado.

---

## ANEXO DE TRATAMIENTO DE DATOS PERSONALES

Anexo al contrato de prestación de servicios de fecha `[fecha]` entre
`[Prestador]` ("**el Encargado**", que opera como "Lince Automatizaciones") y
`[Cliente]` ("**el Responsable**").

### PRIMERA — Roles y objeto

1.1. Respecto de los datos personales tratados por los sistemas objeto del
contrato, el Cliente es **responsable del tratamiento** (decide finalidades y
medios) y el Prestador es **encargado del tratamiento** (art. 25, Ley
25.326): trata los datos por cuenta del Responsable y conforme a sus
instrucciones documentadas.

1.2. Descripción del tratamiento:

| Ítem | Detalle |
|------|---------|
| Finalidad | Operar las automatizaciones contratadas: `[p. ej., respuesta automática de WhatsApp, seguimiento de presupuestos, monitoreo y respuesta de reseñas]` |
| Categorías de titulares | Clientes, potenciales clientes y contactos comerciales del Responsable |
| Categorías de datos | Nombre, teléfono, email, contenido de mensajes, historial de presupuestos y reseñas. **No se tratan datos sensibles** (art. 2, Ley 25.326); si el negocio del Responsable los implicara, se acordará por escrito un tratamiento específico antes de procesarlos |
| Operaciones | Recolección, registro, almacenamiento, consulta, comunicación al propio Responsable, supresión |
| Duración | La vigencia del contrato |

### SEGUNDA — Obligaciones del Encargado

El Encargado se obliga a:

a. Tratar los datos **sólo según las instrucciones del Responsable** y para
las finalidades del contrato; no aplicarlos ni usarlos con un fin distinto
(art. 25 inc. 1), ni cederlos a terceros salvo lo previsto en la cláusula
Cuarta.

b. Guardar **secreto profesional** sobre los datos (art. 10), obligación que
subsiste aun terminado el contrato, y extenderla a toda persona de su equipo
con acceso.

c. Adoptar las **medidas de seguridad** exigidas por el art. 9 y alineadas
con la Resolución AAIP 47/2018: control de accesos por rol, cifrado en
tránsito, credenciales individuales, registro de accesos a producción,
resguardo de copias y procedimiento de recuperación.

d. **Notificar al Responsable sin demora** (objetivo: dentro de las `[48]`
horas de conocido) todo incidente de seguridad que afecte los datos,
informando alcance, datos comprometidos y medidas adoptadas.

e. **Asistir al Responsable** en la atención de pedidos de acceso,
rectificación o supresión de los titulares (arts. 14-16): si un titular se
dirige al Encargado, éste lo reencaminará al Responsable dentro de los
`[3]` días hábiles y ejecutará las correcciones que el Responsable instruya.

f. Ejecutar las **bajas de comunicaciones** (opt-out) que los destinatarios
soliciten a través de los canales automatizados, sin demora y de forma
efectiva (art. 27 inc. 3).

### TERCERA — Obligaciones del Responsable

El Responsable declara y garantiza que: (a) los datos entregados fueron
obtenidos lícitamente y cuenta con base legal para el tratamiento encargado,
incluido el **opt-in** para mensajes salientes cuando corresponda; (b) sus
propias políticas informan a los titulares el uso de proveedores
tecnológicos; (c) mantendrá indemne al Encargado frente a reclamos derivados
de la ilicitud del origen de los datos o de instrucciones del Responsable
contrarias a la normativa. El Encargado advertirá por escrito cuando una
instrucción le parezca contraria a la Ley 25.326.

### CUARTA — Subencargados e infraestructura

4.1. El Responsable autoriza el uso de los siguientes proveedores de
infraestructura como subencargados: `[Supabase (base de datos y
autenticación), Render (backend), Cloudflare (frontend/CDN), Meta/WhatsApp
Business API, otros según la Propuesta]`.

4.2. El Encargado contratará esos servicios bajo sus términos y acuerdos de
tratamiento de datos estándar, e informará al Responsable con `[15]` días de
anticipación la incorporación o reemplazo de un subencargado, pudiendo el
Responsable oponerse por motivos razonables.

4.3. **Transferencia internacional (art. 12, Ley 25.326):** el Responsable
conoce y autoriza que dichos proveedores pueden alojar los datos fuera de la
República Argentina (típicamente Estados Unidos o la Unión Europea), bajo los
acuerdos de tratamiento y salvaguardas contractuales de cada proveedor.

### QUINTA — Terminación

Al terminar el contrato, el Encargado, a elección del Responsable,
**devolverá** los datos en un formato reutilizable (exportación CSV/SQL) o
los **destruirá** de sus sistemas y los de sus subencargados, dentro de los
`[30]` días, certificándolo por escrito. Podrá conservar sólo lo que una
norma le exija almacenar, debidamente bloqueado (art. 25 inc. 2: los datos
deben destruirse salvo orden de conservación legal).

### SEXTA — Verificación

El Responsable podrá requerir, hasta `[una]` vez por año y con aviso de
`[10]` días, información razonable que acredite el cumplimiento de este
anexo (descripción de medidas de seguridad vigentes, lista de subencargados,
constancias de baja de datos).

### SÉPTIMA — Vigencia y prelación

Este anexo rige mientras el Encargado conserve datos del Responsable. En
materia de datos personales, prevalece sobre el cuerpo principal del
contrato. En lo no previsto se aplican la Ley 25.326, su reglamentación y las
disposiciones de la AAIP.

| EL RESPONSABLE (Cliente) | EL ENCARGADO (Prestador) |
|---|---|
| Firma: ______________________ | Firma: ______________________ |
| Aclaración: | Aclaración: |
| DNI/CUIT: | DNI/CUIT: |
