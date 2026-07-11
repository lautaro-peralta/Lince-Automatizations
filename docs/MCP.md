# Conectar IA (MCP) — Startup OS

El backend expone un **servidor MCP** (Model Context Protocol) en `POST /mcp`.
Cualquier cliente MCP —Claude Code, Claude Desktop, Cursor, VS Code, la propia
API de Anthropic u otro modelo que hable MCP— puede operar el Startup OS:
leer el dashboard, registrar gastos, aprobar los ajenos, hacer check-in de
OKRs, emitir facturas, cargar métricas de anuncios, etc.

## Cómo funciona (y por qué es seguro)

```
cliente MCP ──POST /mcp──> API (Render) ──herramienta──> misma API REST ──> Supabase
                              │
                              └── Authorization: Bearer lmcp_... (token por socio)
```

- Cada herramienta MCP **reenvía** la llamada al endpoint REST existente de la
  misma API, con el mismo `Authorization` del cliente. No hay un camino
  alternativo a la base: la IA tiene exactamente los permisos del socio dueño
  del token y las **mismas reglas anti-fraude** (nadie aprueba su propio
  gasto, doble aprobación por montos críticos, bitácora inmutable).
- **Sin deletes**: a propósito, ninguna herramienta borra datos. Las bajas
  reales se hacen por estado (`cancelada`, `baja`, `anulada`) y el borrado
  físico queda solo en la app.
- Los tokens (`lmcp_...`) se generan por socio en **Startup OS → Integraciones
  → Conectar IA**. En la base solo se guarda su hash SHA-256; el secreto se
  muestra una única vez. Revocar es instantáneo.
- `/mcp` también acepta un JWT de Supabase vigente (roles `socio`/`admin`),
  pero expira cada hora: para clientes MCP usá el token `lmcp_`.

## Puesta en marcha

1. **Migración**: aplicar [`supabase/migrations/0005_mcp_tokens.sql`](../supabase/migrations/0005_mcp_tokens.sql)
   (Studio → SQL Editor → Run, o `supabase db push`).
2. **Deploy de la API**: el servidor MCP vive dentro del backend de Render
   (`api/`); con el deploy normal ya queda publicado en
   `https://<tu-api>.onrender.com/mcp`. No hay variables de entorno nuevas.
3. **Token**: entrá a Startup OS → **Conectar IA (MCP)** → *Generar token* y
   copialo (no se vuelve a mostrar).

> Alternativa sin UI: `curl -X POST <API>/api/mcp/tokens -H "Authorization:
> Bearer <jwt-de-supabase>" -H "content-type: application/json" -d
> '{"label":"Mi cliente"}'` — el JWT sale de la sesión del panel.

## Conectar cada cliente

Reemplazá `<API>` por la URL pública del backend (Render) y `<TOKEN>` por tu
token `lmcp_...`.

### Claude Code (CLI)

```bash
claude mcp add --transport http startup-os <API>/mcp \
  --header "Authorization: Bearer <TOKEN>"
```

### Claude Desktop

Los conectores remotos de Desktop usan OAuth, así que el camino simple es el
puente [`mcp-remote`](https://www.npmjs.com/package/mcp-remote) en
`claude_desktop_config.json` (Settings → Developer → Edit Config):

```json
{
  "mcpServers": {
    "startup-os": {
      "command": "npx",
      "args": [
        "-y", "mcp-remote", "<API>/mcp",
        "--header", "Authorization: Bearer <TOKEN>"
      ]
    }
  }
}
```

### API de Anthropic (conector MCP nativo)

Para automatizaciones propias con el SDK (beta `mcp-client-2025-11-20`):

```python
client.beta.messages.create(
    model="claude-opus-4-8",
    max_tokens=16000,
    betas=["mcp-client-2025-11-20"],
    mcp_servers=[{
        "type": "url",
        "url": "<API>/mcp",
        "name": "startup-os",
        "authorization_token": "<TOKEN>",
    }],
    tools=[{"type": "mcp_toolset", "mcp_server_name": "startup-os"}],
    messages=[{"role": "user", "content": "¿Cómo venimos con los OKRs del trimestre?"}],
)
```

### Cursor / VS Code / otros clientes MCP

Cualquier cliente que soporte transporte **HTTP (streamable)** con headers:

```json
{
  "mcpServers": {
    "startup-os": {
      "url": "<API>/mcp",
      "headers": { "Authorization": "Bearer <TOKEN>" }
    }
  }
}
```

> **claude.ai (web)**: los conectores custom del sitio requieren OAuth, que
> este servidor todavía no implementa. Usá Claude Code, Claude Desktop
> (mcp-remote) o la API. Sumar OAuth queda como mejora futura.

## Herramientas expuestas (24)

| Herramienta | Qué hace |
|---|---|
| `get_dashboard` | Resumen ejecutivo completo (gastos, ads, SaaS, MRR, churn, cobranzas, OKRs) |
| `list_expenses` / `create_expense` / `decide_expense` | Gastos: listar con bitácora, registrar, aprobar/rechazar los ajenos |
| `list_clients` / `create_client` / `update_client` | Cartera/CRM: alta, salud (churn), MRR, estados |
| `list_invoices` / `create_invoice` / `update_invoice` | Facturación: emitir, marcar pagada/vencida/anulada |
| `list_subscriptions` / `create_subscription` / `update_subscription` | SaaS: inventario, pausar/cancelar, renovaciones |
| `list_okrs` / `create_okr` / `update_okr` / `add_key_result` / `update_key_result` | OKRs: objetivos, check-ins de KRs, archivado |
| `list_roadmap` / `create_roadmap_item` / `update_roadmap_item` | Roadmap trimestral enlazado a OKRs |
| `get_ads_performance` / `record_ad_metrics` | Anuncios: ROAS/CAC por canal, carga mensual (upsert) |
| `list_partners` | Socios (para asignar dueños por uuid) |

Las validaciones (montos, enums, fechas) son las mismas zod de la API; un
error de negocio vuelve como resultado `isError` con el mensaje del servidor.

## Detalles técnicos

- Transporte: **Streamable HTTP en modo stateless** (`POST /mcp`, respuestas
  JSON directas, sin sesión). Ideal para Render free tier: no hay estado que
  se pierda si el servicio duerme. `GET`/`DELETE /mcp` responden 405.
- Endpoints de gestión (mismo login del panel, rol socio/admin):
  - `GET /api/mcp/tokens` — mis tokens (sin secreto)
  - `POST /api/mcp/tokens` `{ label }` — genera; devuelve `token` una sola vez
  - `DELETE /api/mcp/tokens/:id` — revoca (la fila queda para auditoría)
- Código: [`api/src/mcp/tools.js`](../api/src/mcp/tools.js) (catálogo),
  [`api/src/mcp/server.js`](../api/src/mcp/server.js) (puente),
  [`api/src/routes/mcp.js`](../api/src/routes/mcp.js) (endpoint HTTP).

## Probar rápido con curl

```bash
curl -X POST <API>/mcp \
  -H "Authorization: Bearer <TOKEN>" \
  -H "content-type: application/json" \
  -H "accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```
