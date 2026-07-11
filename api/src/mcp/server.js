/**
 * Servidor MCP (Model Context Protocol) del Startup OS.
 *
 * Expone el ERP a Claude y a cualquier otro cliente MCP (Cursor, VS Code,
 * ChatGPT, etc.) como un set de herramientas. Cada herramienta REENVÍA la
 * llamada al endpoint REST correspondiente de esta misma API (loopback a
 * 127.0.0.1), con el mismo header Authorization del cliente MCP:
 *
 *   cliente MCP ── POST /mcp ── herramienta ── fetch 127.0.0.1/api/... ── Supabase
 *
 * Por eso la IA tiene EXACTAMENTE los mismos permisos y reglas de negocio que
 * el socio dueño del token (anti-fraude de gastos incluido): no hay un camino
 * alternativo a la base.
 *
 * El server se construye POR REQUEST (modo stateless del transporte HTTP):
 * es barato, no guarda sesión y sobrevive a los reinicios de Render.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { config } from '../config.js';
import { TOOLS } from './tools.js';

/** Reenvía una llamada de herramienta a la API REST local. */
async function callApi(authHeader, { method, path, query, body }) {
  const url = new URL(path, `http://127.0.0.1:${config.port}`);
  for (const [key, value] of Object.entries(query || {})) {
    if (value !== undefined && value !== null) url.searchParams.set(key, value);
  }
  const hasBody = body !== undefined && method !== 'GET';
  const res = await fetch(url, {
    method,
    headers: {
      authorization: authHeader,
      ...(hasBody ? { 'content-type': 'application/json' } : {}),
    },
    body: hasBody ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* respuesta sin cuerpo JSON: se informa por status */
  }
  return { ok: res.ok, status: res.status, json };
}

/** Da formato MCP al resultado (texto JSON legible; isError si la API falló). */
function toToolResult({ ok, status, json }, postFilter, args) {
  if (!ok) {
    const message = json?.message || `La API respondió HTTP ${status}.`;
    const detail = json?.errors ? `\n${JSON.stringify(json.errors, null, 2)}` : '';
    return {
      content: [{ type: 'text', text: `Error (${status}): ${message}${detail}` }],
      isError: true,
    };
  }
  let data = json && json.data !== undefined ? json.data : json;
  if (postFilter) data = postFilter(data, args);
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

/**
 * Construye un McpServer atado al Authorization del request entrante.
 * @param {string} authHeader  `Bearer <jwt de Supabase | token lmcp_...>`
 */
export function buildMcpServer(authHeader) {
  const server = new McpServer({
    name: 'lince-startup-os',
    version: '1.0.0',
  });

  for (const tool of TOOLS) {
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: tool.input,
        annotations: {
          readOnlyHint: Boolean(tool.readOnly),
          // Nada acá borra datos: los deletes quedaron fuera a propósito.
          destructiveHint: false,
        },
      },
      async (args = {}) => {
        try {
          const result = await callApi(authHeader, tool.request(args));
          return toToolResult(result, tool.postFilter, args);
        } catch (err) {
          return {
            content: [{ type: 'text', text: `Error interno: ${err.message}` }],
            isError: true,
          };
        }
      }
    );
  }

  return server;
}
