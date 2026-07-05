/**
 * Smoke tests del backend (sin dependencias externas, sin DB real).
 *
 * Ejecutar con:  npm test
 *
 * Cubre lo verificable sin desplegar:
 *   1. Capa de notificaciones (notify): log sin proveedores, webhook recibe,
 *      webhook caído no rompe.
 *   2. Sugerencia de reseñas (ai): fallback de plantilla sin ANTHROPIC_API_KEY.
 *   3. Rutas del servidor: /health 200, validación 400, auth 401, 404.
 *
 * No prueba el ida-y-vuelta contra Supabase (eso requiere credenciales/deploy).
 */
import http from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const API_DIR = join(__dirname, '..');

let passed = 0;
let failed = 0;
function check(name, ok) {
  if (ok) {
    passed++;
    console.log('  ✓ ' + name);
  } else {
    failed++;
    console.log('  ✗ ' + name);
  }
}

function request(base, method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request(
      base + path,
      { method, headers: { 'Content-Type': 'application/json' } },
      (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => resolve([res.statusCode, d]));
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function waitUp(base) {
  for (let i = 0; i < 60; i++) {
    try {
      await request(base, 'GET', '/health');
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  throw new Error('el server no levantó');
}

async function testNotify() {
  console.log('notify');
  // Sin proveedores configurados -> loguea, no lanza.
  delete process.env.NOTIFY_WEBHOOK_URL;
  delete process.env.RESEND_API_KEY;
  delete process.env.NOTIFY_EMAIL_TO;
  const { notifyNewLead } = await import('../src/lib/notify.js');
  let threw = false;
  try {
    await notifyNewLead({ name: 'Ana', contact: 'a@a.com', message: 'hola' });
  } catch {
    threw = true;
  }
  check('sin proveedores no lanza', threw === false);

  // Webhook recibe el POST; un 500 posterior no rompe. Se corre en un proceso
  // hijo con la env ya seteada, porque config lee el entorno una sola vez al
  // arrancar (comportamiento correcto en producción).
  let received = null;
  let calls = 0;
  const srv = http.createServer((req, res) => {
    let d = '';
    req.on('data', (c) => (d += c));
    req.on('end', () => {
      calls++;
      if (calls === 1) {
        received = d;
        res.statusCode = 200;
        res.end('ok');
      } else {
        res.statusCode = 500; // segundo envío falla a propósito
        res.end('fail');
      }
    });
  });
  await new Promise((r) => srv.listen(4090, r));

  const notifyUrl = pathToFileURL(join(API_DIR, 'src/lib/notify.js')).href;
  const childCode =
    `import { notifyNewLead } from ${JSON.stringify(notifyUrl)};` +
    `await notifyNewLead({ name: 'Ana', contact: 'a@a.com', business: 'Kiosco', message: 'hola' });` +
    `await notifyNewLead({ name: 'Bob', contact: 'b@b.com', message: 'x' });`;
  const exitCode = await new Promise((resolve) => {
    const child = spawn('node', ['--input-type=module', '-e', childCode], {
      cwd: API_DIR,
      env: { ...process.env, NOTIFY_WEBHOOK_URL: 'http://localhost:4090/hook' },
      stdio: 'ignore',
    });
    child.on('exit', (code) => resolve(code));
  });

  check('webhook recibe el payload', !!received && received.includes('new_lead') && received.includes('Ana'));
  check('webhook 500 no rompe (hijo sale 0)', exitCode === 0 && calls === 2);
  srv.close();
}

async function testAi() {
  console.log('ai');
  delete process.env.ANTHROPIC_API_KEY;
  const { suggestReviewReply } = await import('../src/lib/ai.js');
  const neg = await suggestReviewReply({ rating: 1, author: 'Ana', text: 'Mala atención' });
  const pos = await suggestReviewReply({ rating: 5, author: 'Marcos', text: 'Excelente' });
  check('plantilla negativa', /Lamentamos/.test(neg));
  check('plantilla positiva', /gracias/i.test(pos));
}

async function testRoutes() {
  console.log('rutas');
  const port = 4099;
  const base = `http://localhost:${port}`;
  const child = spawn('node', ['src/server.js'], {
    cwd: API_DIR,
    env: { ...process.env, PORT: String(port), NODE_ENV: 'test' },
    stdio: 'ignore',
  });
  try {
    await waitUp(base);
    const cases = [
      ['GET', '/health', null, 200],
      ['POST', '/api/leads', {}, 400], // validación antes de tocar DB
      ['GET', '/api/leads', null, 401], // requiere admin
      ['PATCH', '/api/leads/abc', { status: 'ganado' }, 401],
      ['GET', '/api/budgets', null, 401],
      ['POST', '/api/budgets', { customer_name: 'x' }, 401],
      ['GET', '/api/reviews', null, 401],
      ['POST', '/api/reviews/abc/suggest', null, 401],
      ['GET', '/api/stats', null, 401],
      // Startup OS: requireSocio corta antes que la validación => 401 sin token.
      ['GET', '/api/me', null, 401],
      ['GET', '/api/me/partners', null, 401],
      ['GET', '/api/expenses', null, 401],
      ['POST', '/api/expenses', {}, 401],
      ['POST', '/api/expenses/abc/approve', null, 401],
      ['POST', '/api/expenses/abc/reject', null, 401],
      ['GET', '/api/ads', null, 401],
      ['POST', '/api/ads', {}, 401],
      ['GET', '/nope', null, 404],
    ];
    for (const [m, p, b, exp] of cases) {
      const [code] = await request(base, m, p, b);
      check(`${m} ${p} => ${code} (esperado ${exp})`, code === exp);
    }
  } finally {
    child.kill();
  }
}

async function testCors() {
  console.log('cors');
  const port = 4097;
  const base = `http://localhost:${port}`;
  // FRONTEND_ORIGIN con barra final a propósito (el error de config más común).
  const child = spawn('node', ['src/server.js'], {
    cwd: API_DIR,
    env: { ...process.env, PORT: String(port), NODE_ENV: 'test', FRONTEND_ORIGIN: 'https://app.example.com/' },
    stdio: 'ignore',
  });

  // Devuelve el header access-control-allow-origin para un Origin dado.
  const acao = (origin) =>
    new Promise((resolve, reject) => {
      const r = http.request(base + '/health', { method: 'GET', headers: { Origin: origin } }, (res) => {
        res.resume();
        resolve(res.headers['access-control-allow-origin']);
      });
      r.on('error', reject);
      r.end();
    });

  try {
    await waitUp(base);
    // El navegador manda el Origin SIN barra final; debe permitirse igual.
    const allowed = await acao('https://app.example.com');
    check('origen permitido recibe ACAO (tolera barra final en config)', !!allowed);
    // Un origen distinto NO debe recibir ACAO.
    const blocked = await acao('https://malicioso.com');
    check('origen no permitido NO recibe ACAO', !blocked);
  } finally {
    child.kill();
  }
}

(async () => {
  await testNotify();
  await testAi();
  await testRoutes();
  await testCors();
  console.log(`\n${passed} OK, ${failed} fallidos`);
  process.exit(failed === 0 ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
