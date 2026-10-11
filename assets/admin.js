(function () {
  const form = document.getElementById('adminAuthForm');
  const panel = document.getElementById('adminPanel');
  const status = document.getElementById('adminStatus');
  const logoutButton = document.getElementById('adminLogout');
  if (!form || !panel) return;
  const section = document.getElementById('admin');
  const accessButton = document.getElementById('adminAccess');
  const closeButton = document.getElementById('adminClose');
  let busy = false;

  function showAdmin() {
    section.hidden = false;
    accessButton.setAttribute('aria-expanded', 'true');
    closeButton.focus({ preventScroll: true });
    section.scrollIntoView({ block: 'start' });
    window.history.replaceState(null, '', '#admin');
  }

  function hideAdmin() {
    section.hidden = true;
    accessButton.setAttribute('aria-expanded', 'false');
    if (window.location.hash === '#admin') {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    accessButton.focus();
  }

  accessButton.addEventListener('click', () => {
    if (section.hidden) showAdmin();
    else hideAdmin();
  });
  closeButton.addEventListener('click', hideAdmin);
  section.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      hideAdmin();
    }
  });
  window.addEventListener('hashchange', () => {
    if (window.location.hash === '#admin') showAdmin();
  });
  if (window.location.hash === '#admin') showAdmin();

  function message(text, error = false) {
    status.textContent = text;
    status.dataset.error = String(error);
  }

  function closePanel() {
    panel.style.display = 'none';
    form.hidden = false;
    logoutButton.hidden = true;
  }

  function setBusy(value) {
    busy = value;
    form.querySelectorAll('input, button').forEach(element => { element.disabled = value; });
    logoutButton.disabled = value;
  }

  async function api(endpoint = 'admin-auth', body) {
    const response = await fetch('/.netlify/functions/' + endpoint, {
      method: body ? 'POST' : 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      closePanel();
      throw new Error(data.error || 'Service indisponible. Réessayez plus tard.');
    }
    return data;
  }

  window.pokemarketRequireAdmin = async function () {
    try {
      const data = await api();
      if (!data.user) throw new Error('Connectez-vous avec votre compte administrateur.');
      form.hidden = true;
      logoutButton.hidden = false;
      panel.style.display = 'block';
      message('Connecté en tant qu’administrateur : ' + data.user.email);
      return true;
    } catch (error) {
      closePanel();
      message(error.message, true);
      return false;
    }
  };

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    message('Vérification du compte administrateur…');
    try {
      await api('admin-auth', {
        action: 'login',
        email: document.getElementById('adminEmail').value.trim(),
        password: document.getElementById('adminPassword').value
      });
      window.location.reload();
    } catch (error) {
      message(error.message, true);
    } finally {
      document.getElementById('adminPassword').value = '';
      setBusy(false);
    }
  });

  logoutButton.addEventListener('click', async () => {
    if (busy) return;
    setBusy(true);
    try {
      await api('admin-auth', { action: 'logout' });
      closePanel();
      window.location.reload();
    } catch (error) {
      message(error.message, true);
      setBusy(false);
    }
  });

  document.getElementById('adminForgotPassword').addEventListener('click', async () => {
    if (busy || !document.getElementById('adminEmail').reportValidity()) return;
    setBusy(true);
    try {
      await api('customer-auth', {
        action: 'recovery-request',
        email: document.getElementById('adminEmail').value.trim()
      });
      message('Si ce compte existe, un lien de réinitialisation a été envoyé par e-mail.');
    } catch (error) {
      message(error.message, true);
    } finally {
      setBusy(false);
    }
  });

  window.addEventListener('pageshow', () => { window.pokemarketRequireAdmin(); });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) window.pokemarketRequireAdmin();
  });
})();
