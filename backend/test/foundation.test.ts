import { createApp } from '../src/app.js';
import type { Server } from 'http';

async function runTests(): Promise<void> {
  console.log('--- Starting VISTHAAPAN Backend Foundation Verification Tests ---');

  // Instantiate app with a test route to verify unexpected error handling
  const app = createApp({
    extraRoutes: (testApp) => {
      testApp.get('/test/trigger-error', () => {
        throw new Error('Simulated unhandled exception for testing error middleware');
      });
    },
  });

  // Start on an ephemeral port (0 lets the OS pick an available port)
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to obtain server address');
  }

  const baseUrl = `http://localhost:${address.port}`;
  console.log(`Test server running at ${baseUrl}`);

  let passed = 0;
  let total = 0;

  async function assertTest(name: string, fn: () => Promise<void>): Promise<void> {
    total++;
    try {
      await fn();
      console.log(`  ✓ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ [FAIL] ${name}:`, err);
      server.close();
      process.exit(1);
    }
  }

  // 1. Health Check Endpoint
  await assertTest('GET /api/v1/health returns HTTP 200 with structured status', async () => {
    const res = await fetch(`${baseUrl}/api/v1/health`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);

    const data = await res.json() as Record<string, unknown>;
    if (data.success !== true) throw new Error('Expected success: true');
    if (data.service !== 'VISTHAAPAN API') throw new Error(`Unexpected service: ${data.service}`);
    if (data.status !== 'healthy') throw new Error(`Unexpected status: ${data.status}`);
    if (data.version !== 'v1') throw new Error(`Unexpected version: ${data.version}`);
    if (typeof data.timestamp !== 'string') throw new Error('Missing timestamp string');
    if (typeof data.uptimeSeconds !== 'number') throw new Error('Missing uptimeSeconds');

    const requestId = res.headers.get('x-request-id');
    if (!requestId) throw new Error('Missing X-Request-Id header on response');
  });

  // 2. Root API Information Endpoint
  await assertTest('GET /api/v1 returns HTTP 200 with service metadata', async () => {
    const res = await fetch(`${baseUrl}/api/v1`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);

    const body = await res.json() as { success: boolean; data: { service: string; version: string; modules: Record<string, string> } };
    if (body.success !== true) throw new Error('Expected success: true');
    if (body.data.service !== 'VISTHAAPAN API') throw new Error('Unexpected service title');
    if (body.data.version !== 'v1') throw new Error('Unexpected version');
    if (body.data.modules.health !== 'operational') throw new Error('Health module not reported as operational');
  });

  // 3. Unmatched Route (404)
  await assertTest('GET /unknown returns HTTP 404 with standardized error envelope', async () => {
    const res = await fetch(`${baseUrl}/unknown`);
    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);

    const body = await res.json() as { success: boolean; error: { code: string; message: string } };
    if (body.success !== false) throw new Error('Expected success: false');
    if (body.error.code !== 'NOT_FOUND') throw new Error(`Expected error.code: NOT_FOUND, got ${body.error.code}`);
    if (!body.error.message.includes('Resource not found')) throw new Error(`Unexpected message: ${body.error.message}`);
  });

  // 4. Malformed JSON Body (400)
  await assertTest('POST with malformed JSON body returns HTTP 400 with MALFORMED_JSON code', async () => {
    const res = await fetch(`${baseUrl}/api/v1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"invalidJson": broken',
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);

    const body = await res.json() as { success: boolean; error: { code: string; message: string } };
    if (body.success !== false) throw new Error('Expected success: false');
    if (body.error.code !== 'MALFORMED_JSON') throw new Error(`Expected error.code: MALFORMED_JSON, got ${body.error.code}`);
  });

  // 5. Centralized Error Handler (500)
  await assertTest('Unhandled exception returns HTTP 500 with INTERNAL_SERVER_ERROR', async () => {
    const res = await fetch(`${baseUrl}/test/trigger-error`);
    if (res.status !== 500) throw new Error(`Expected 500, got ${res.status}`);

    const body = await res.json() as { success: boolean; error: { code: string; message: string } };
    if (body.success !== false) throw new Error('Expected success: false');
    if (body.error.code !== 'INTERNAL_SERVER_ERROR') throw new Error(`Expected error.code: INTERNAL_SERVER_ERROR, got ${body.error.code}`);
  });

  // 6. CORS Options Preflight Check
  await assertTest('OPTIONS preflight returns allowed CORS headers for frontend origin', async () => {
    const res = await fetch(`${baseUrl}/api/v1/health`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
      },
    });
    const allowOrigin = res.headers.get('access-control-allow-origin');
    if (allowOrigin !== 'http://localhost:5173') {
      throw new Error(`Unexpected CORS allow origin: ${allowOrigin}`);
    }
  });

  // Cleanup
  await new Promise<void>((resolve, reject) => {
    server.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  console.log(`\nAll ${passed}/${total} foundation verification tests passed successfully!`);
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
