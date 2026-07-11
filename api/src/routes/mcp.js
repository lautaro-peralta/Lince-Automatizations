/**
 * Endpoint HTTP del servidor MCP: POST /mcp (transporte "Streamable HTTP").
 *
 * Autenticación: `Authorization: Bearer <token>`, donde el token es un token
 * MCP de larga vida (`lmcp_...`, generado en la vista "Conectar IA" del
 * Startup OS) o un JWT de Supabase vigente. Solo roles socio/admin.
 *
 * Modo STATELESS del SDK: cada POST crea su propio par server+transport y las
 * respuestas van como JSON directo (sin stream SSE). Es lo más simple y lo más
 * robusto detrás de Render: no hay sesión que se pierda si el servicio duerme.
 * GET y DELETE (propios del modo con sesión) responden 405.
 */
import { Router } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { resolveToken } from '../middleware/auth.js';
import { buildMcpServer } from '../mcp/server.js';

const router = Router();

const MCP_ROLES = ['socio', 'admin'];

/** Error JSON-RPC con el status HTTP que corresponda. */
function rpcError(res, status, code, message) {
  if (status === 401) {
    // Le indica al cliente MCP que tiene que mandar credenciales (spec de auth).
    res.set('WWW-Authenticate', 'Bearer realm="lince-startup-os"');
  }
  return res.status(status).json({
    jsonrpc: '2.0',
    error: { code, message },
    id: null,
  });
}

// POST /mcp — toda la conversación JSON-RPC entra por acá.
router.post('/', async (req, res) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      return rpcError(
        res,
        401,
        -32001,
        'Falta el token. Generá uno en Startup OS → Conectar IA y mandalo como Authorization: Bearer <token>.'
      );
    }

    const resolved = await resolveToken(token);
    if (!resolved) {
      return rpcError(res, 401, -32001, 'Token inválido, revocado o expirado.');
    }
    if (!resolved.profile || !MCP_ROLES.includes(resolved.profile.role)) {
      return rpcError(res, 403, -32002, 'No tenés acceso al Startup OS.');
    }

    // Un server+transport por request (stateless): las herramientas quedan
    // atadas al Authorization de ESTE request.
    const server = buildMcpServer(header);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    res.on('close', () => {
      transport.close();
      server.close();
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[mcp]', err);
    if (!res.headersSent) {
      rpcError(res, 500, -32603, 'Error interno del servidor MCP.');
    }
  }
});

// En modo stateless no hay stream de servidor ni sesiones que cerrar.
router.get('/', (_req, res) => {
  res.set('Allow', 'POST').status(405).json({
    jsonrpc: '2.0',
    error: { code: -32000, message: 'Método no permitido: usá POST (modo stateless).' },
    id: null,
  });
});
router.delete('/', (_req, res) => {
  res.set('Allow', 'POST').status(405).json({
    jsonrpc: '2.0',
    error: { code: -32000, message: 'Método no permitido: usá POST (modo stateless).' },
    id: null,
  });
});

export default router;
