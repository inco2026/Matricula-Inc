import { createClient } from './vendor/supabase-js-2.118.0.js';

// La recuperación usa una sesión separada y temporal; no reemplaza otra sesión abierta.
const cliente = createClient('https://vyopgfclpxhkqqxiatmv.supabase.co',
  'sb_publishable_FCfYiSMpJVdkYeW5WvixDA_1E1ytUkz',
  { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
const solicitar = document.getElementById('solicitar');
const verificar = document.getElementById('verificar');
const cambiar = document.getElementById('cambiar');
const estado = document.getElementById('estado');
let correoVerificado = '';
let identidadVerificada = false;
function paso(formulario, texto) {
  [solicitar, verificar, cambiar].forEach(form => { form.hidden = form !== formulario; });
  document.getElementById('instruccion').textContent = texto;
  formulario?.querySelector('input')?.focus();
}
async function ejecutar(form, accion) {
  const boton = form.querySelector('[type="submit"]');
  boton.disabled = true;
  estado.textContent = 'Un momento, por favor…';
  try { await accion(); }
  catch (error) {
    estado.textContent = error?.status === 429
      ? 'Has realizado varios intentos. Espera unos minutos antes de volver a intentarlo.'
      : error.message || 'No se pudo conectar. Revisa tu conexión e intenta nuevamente.';
  } finally { boton.disabled = false; }
}
solicitar.addEventListener('submit', event => {
  event.preventDefault();
  ejecutar(solicitar, async () => {
    const correo = document.getElementById('correo').value.trim();
    const { error } = await cliente.auth.resetPasswordForEmail(correo);
    if (error) throw new Error('No se pudo enviar el código. Espera unos minutos e intenta nuevamente. Si continúa, solicita ayuda a la administración.');
    correoVerificado = correo;
    paso(verificar, 'Si el correo está registrado, recibirás un código. Revisa también la carpeta de correo no deseado.');
    estado.textContent = '';
  });
});
document.getElementById('otro-correo').addEventListener('click', () => {
  document.getElementById('codigo').value = '';
  paso(solicitar, 'Revisa tu correo antes de solicitar un nuevo código.');
  estado.textContent = '';
});
verificar.addEventListener('submit', event => {
  event.preventDefault();
  ejecutar(verificar, async () => {
    const { data, error } = await cliente.auth.verifyOtp({ email: correoVerificado,
      token: document.getElementById('codigo').value.trim(), type: 'recovery' });
    if (error || !data.session) throw new Error('El código no es válido o ya venció. Revisa el código o solicita uno nuevo.');
    identidadVerificada = true;
    document.getElementById('codigo').value = '';
    paso(cambiar, 'Correo verificado. Elige tu nueva contraseña.');
    estado.textContent = '';
  });
});
cambiar.addEventListener('submit', event => {
  event.preventDefault();
  ejecutar(cambiar, async () => {
    if (!identidadVerificada) throw new Error('Primero verifica el código recibido por correo.');
    const password = document.getElementById('nueva').value;
    if (password !== document.getElementById('confirmar').value) throw new Error('Las contraseñas no coinciden. Escríbelas de nuevo.');
    const { error } = await cliente.auth.updateUser({ password });
    if (error) throw new Error('No se pudo guardar la contraseña. Usa una diferente de al menos 8 caracteres; si tu código venció, vuelve a iniciar la recuperación.');
    identidadVerificada = false;
    cambiar.reset();
    await cliente.auth.signOut({ scope: 'local' });
    paso(null, 'Tu contraseña se actualizó. Vuelve al acceso del personal e ingresa con tu nueva contraseña.');
    estado.textContent = 'Contraseña actualizada correctamente.';
  });
});
