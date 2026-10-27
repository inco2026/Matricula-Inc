document.addEventListener('click', (event) => {
  const boton = event.target.closest('[data-ver-clave]');
  if (!boton) return;
  const campo = document.getElementById(boton.dataset.verClave);
  if (!campo) return;
  const mostrar = campo.type === 'password';
  campo.type = mostrar ? 'text' : 'password';
  boton.setAttribute('aria-pressed', String(mostrar));
  boton.setAttribute('aria-label', mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña');
  boton.querySelector('span').textContent = mostrar ? 'Ocultar' : 'Mostrar';
});
