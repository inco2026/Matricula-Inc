const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { createRequire } = require('node:module');
const { chromium } = createRequire('C:/Users/consu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');

test('Recuperación: exige código válido y contraseñas iguales antes de actualizar', async () => {
  const root = path.resolve(__dirname, '..');
  const server = http.createServer((req, res) => {
    const file = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) { res.statusCode = 404; return res.end(); }
    res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html; charset=utf-8');
    res.end(fs.readFileSync(file));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
    const page = await browser.newPage();
    let cambios = 0;
    const errores = [];
    page.on('pageerror', error => errores.push(error.message));
    await page.route('https://**/*', async route => {
      const req = route.request(), url = new URL(req.url());
      if (!url.hostname.endsWith('.supabase.co')) return route.abort();
      const json = (body, status = 200) => route.fulfill({status, contentType:'application/json', body:JSON.stringify(body)});
      if (url.pathname.endsWith('/recover')) return json({});
      if (url.pathname.endsWith('/verify')) {
        const datos = req.postDataJSON();
        assert.equal(datos.type, 'recovery');
        if (datos.token !== '123456') return json({msg:'Token expired', error_code:'otp_expired'}, 403);
        return json({access_token:'prueba', refresh_token:'refresh', expires_in:3600, token_type:'bearer', user:{id:'cuenta', email:'personal@example.com'}});
      }
      if (url.pathname.endsWith('/user') && req.method() === 'PUT') {
        cambios++;
        assert.equal(req.postDataJSON().password, 'NuevaClave123');
        return json({id:'cuenta', email:'personal@example.com'});
      }
      return json({});
    });
    await page.goto(`http://127.0.0.1:${server.address().port}/recuperar-acceso.html`);
    assert.equal(await page.locator('#cambiar').isVisible(), false);
    await page.locator('#correo').fill('personal@example.com');
    await page.locator('#solicitar button').click();
    await page.locator('#codigo').fill('000000');
    await page.locator('#verificar [type=submit]').click();
    await page.getByText('El código no es válido', {exact:false}).waitFor();
    assert.equal(cambios, 0);
    assert.equal(await page.locator('#cambiar').isVisible(), false);
    await page.locator('#codigo').fill('123456');
    await page.locator('#verificar [type=submit]').click();
    await page.locator('#nueva').fill('NuevaClave123');
    await page.locator('[data-ver-clave]').click();
    assert.equal(await page.locator('#nueva').getAttribute('type'), 'text');
    await page.locator('#confirmar').fill('Diferente123');
    await page.locator('#cambiar [type=submit]').click();
    await page.getByText('Las contraseñas no coinciden.', {exact:false}).waitFor();
    assert.equal(cambios, 0);
    await page.locator('#confirmar').fill('NuevaClave123');
    await page.locator('#cambiar [type=submit]').click();
    await page.getByText('Contraseña actualizada correctamente.').waitFor();
    assert.equal(cambios, 1);
    assert.deepEqual(errores, []);
  } finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
});
