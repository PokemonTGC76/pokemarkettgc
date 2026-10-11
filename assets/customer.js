(function () {
  const panel = document.createElement('section');
  panel.id = 'fichier-client';
  panel.className = 'section';
  panel.innerHTML = `
    <div id="clientPanel">
      <h3>👤 Mon espace client</h3>
      <p style="text-align:center;line-height:1.6">La boutique est accessible sans compte. Connectez-vous uniquement pour enregistrer et retrouver vos coordonnées.</p>
      <div class="client-form">
        <form id="clientAuthForm" hidden>
          <h4 id="clientAuthTitle">Se connecter</h4>
          <div id="clientNameField" hidden><label for="clientAccountName">Nom et prénom</label><input id="clientAccountName" autocomplete="name" minlength="2" maxlength="200"></div>
          <label for="clientAccountEmail">Adresse e-mail</label><input id="clientAccountEmail" type="email" autocomplete="email" maxlength="254" required>
          <label id="clientPasswordLabel" for="clientAccountPassword">Mot de passe</label><input id="clientAccountPassword" type="password" autocomplete="current-password" minlength="8" maxlength="128" required>
          <div class="client-actions">
            <button class="client-btn" id="clientAuthSubmit" type="submit">Se connecter</button>
            <button class="client-btn secondary" id="clientAuthSwitch" type="button">Créer un compte</button>
            <button class="client-btn secondary" id="clientForgotPassword" type="button">Mot de passe oublié</button>
          </div>
        </form>
        <form id="clientProfileForm" hidden>
          <p id="clientAccountStatus"></p>
          <div class="row">
            <div class="field"><label for="clientPrenom">Prénom</label><input id="clientPrenom" autocomplete="given-name" maxlength="100" required></div>
            <div class="field"><label for="clientNom">Nom</label><input id="clientNom" autocomplete="family-name" maxlength="100" required></div>
          </div>
          <label for="clientEmail">E-mail du compte</label><input id="clientEmail" type="email" autocomplete="email" readonly>
          <label for="clientTel">Téléphone (facultatif)</label><input id="clientTel" type="tel" autocomplete="tel" maxlength="40">
          <label for="clientAdresse">Adresse de livraison</label><input id="clientAdresse" autocomplete="street-address" maxlength="500" required>
          <div class="client-actions">
            <button class="client-btn" id="saveClient" type="submit">Enregistrer mon profil</button>
            <button class="client-btn secondary" id="deleteClient" type="button">Effacer mes coordonnées</button>
            <button class="client-btn secondary" id="clientLogout" type="button">Se déconnecter</button>
          </div>
          <div id="clientSaved" class="client-card" hidden></div>
        </form>
        <p id="clientStatus" class="client-status" role="status" aria-live="polite">Chargement de l’espace client…</p>
        <p class="client-note">Les coordonnées sont enregistrées dans la base Netlify de la boutique et accessibles uniquement depuis votre compte. Aucune donnée bancaire ni aucun mot de passe n’est enregistré dans cette base.</p>
      </div>
    </div>`;
  document.querySelector('main').insertBefore(panel, document.querySelector('#contact'));
  const shortcut = document.createElement('button');
  shortcut.id = 'clientButton';
  shortcut.className = 'client-btn';
  shortcut.textContent = '👤 Espace client';
  shortcut.type = 'button';
  shortcut.addEventListener('click', () => panel.scrollIntoView({ behavior: 'smooth' }));
  document.body.appendChild(shortcut);

  const fieldNames = ['prenom', 'nom', 'email', 'tel', 'adresse'];
  const authForm = document.getElementById('clientAuthForm');
  const profileForm = document.getElementById('clientProfileForm');
  const status = document.getElementById('clientStatus');
  const saved = document.getElementById('clientSaved');
  let mode = 'login';
  let user = null;
  let recoveryToken = null;
  let busy = false;

  function field(name) {
    return document.getElementById('client' + name.charAt(0).toUpperCase() + name.slice(1));
  }

  function message(text, error = false) {
    status.textContent = text;
    status.dataset.error = String(error);
  }

  function setBusy(value) {
    busy = value;
    panel.querySelectorAll('button, input').forEach(element => { element.disabled = value; });
  }

  async function api(endpoint, method = 'GET', body) {
    const response = await fetch('/.netlify/functions/' + endpoint, {
      method,
      credentials: 'same-origin',
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401 && endpoint === 'client-profile') {
        user = null;
        profileForm.hidden = true;
        saved.textContent = '';
        profileForm.reset();
        setMode('login');
      }
      throw new Error(data.error || 'Service indisponible. Réessayez plus tard.');
    }
    return data;
  }

  function setMode(nextMode) {
    mode = nextMode;
    authForm.hidden = false;
    const signup = mode === 'signup';
    const recovery = mode === 'recovery-request';
    const reset = mode === 'recover' || mode === 'invite';
    document.getElementById('clientNameField').hidden = !signup;
    document.getElementById('clientAccountName').required = signup;
    const email = document.getElementById('clientAccountEmail');
    email.hidden = reset;
    email.required = !reset;
    panel.querySelector('label[for="clientAccountEmail"]').hidden = reset;
    const password = document.getElementById('clientAccountPassword');
    password.hidden = recovery;
    password.required = !recovery;
    password.value = '';
    password.autocomplete = signup || reset ? 'new-password' : 'current-password';
    document.getElementById('clientPasswordLabel').hidden = recovery;
    const title = signup ? 'Créer un compte' : recovery ? 'Recevoir un lien de réinitialisation' : mode === 'invite' ? 'Activer le compte invité' : reset ? 'Choisir un nouveau mot de passe' : 'Se connecter';
    document.getElementById('clientAuthTitle').textContent = title;
    document.getElementById('clientAuthSubmit').textContent = title;
    document.getElementById('clientAuthSwitch').textContent = mode === 'login' ? 'Créer un compte' : 'Se connecter';
    document.getElementById('clientForgotPassword').hidden = mode !== 'login';
  }

  function populate(profile) {
    fieldNames.forEach(name => { field(name).value = profile?.[name] || (name === 'email' ? user.email : ''); });
    saved.hidden = !profile;
    saved.textContent = profile ? `Profil enregistré pour ${profile.prenom} ${profile.nom}\n${user.email}\n${profile.tel}\n${profile.adresse}` : '';
  }

  async function loadProfile() {
    authForm.hidden = true;
    profileForm.hidden = false;
    document.getElementById('clientAccountStatus').textContent = 'Connecté : ' + user.email;
    const data = await api('client-profile');
    populate(data.profile);
    message(data.profile ? 'Vos coordonnées ont été retrouvées dans la base Netlify.' : 'Renseignez vos coordonnées pour enregistrer votre profil.');
  }

  document.getElementById('clientAuthSwitch').addEventListener('click', () => {
    recoveryToken = null;
    setMode(mode === 'login' ? 'signup' : 'login');
    message('');
  });
  document.getElementById('clientForgotPassword').addEventListener('click', () => {
    setMode('recovery-request');
    message('');
  });

  authForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    const action = mode;
    const body = {
      action,
      email: document.getElementById('clientAccountEmail').value.trim(),
      password: document.getElementById('clientAccountPassword').value,
      name: document.getElementById('clientAccountName').value.trim()
    };
    if (action === 'recover' || action === 'invite') body.token = recoveryToken;
    try {
      const result = await api('customer-auth', 'POST', body);
      if (action === 'login') {
        window.location.reload();
        return;
      }
      recoveryToken = null;
      setMode('login');
      message(action === 'signup'
        ? result.confirmationRequired ? 'Compte créé. Confirmez votre e-mail grâce au lien reçu, puis connectez-vous.' : 'Compte créé. Vous pouvez maintenant vous connecter.'
        : action === 'invite' ? 'Invitation acceptée. Vous pouvez vous connecter avec votre nouveau mot de passe.'
          : action === 'recover' ? 'Mot de passe mis à jour. Connectez-vous avec votre nouveau mot de passe.'
          : 'Si un compte correspond à cette adresse, un lien de réinitialisation a été envoyé.');
    } catch (error) {
      message(error.message, true);
    } finally {
      document.getElementById('clientAccountPassword').value = '';
      setBusy(false);
    }
  });

  profileForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const body = Object.fromEntries(fieldNames.map(name => [name, field(name).value.trim()]));
      const data = await api('client-profile', 'PUT', body);
      populate(data.profile);
      message('Votre profil est enregistré dans la base Netlify.');
    } catch (error) {
      message(error.message, true);
    } finally {
      setBusy(false);
    }
  });

  document.getElementById('deleteClient').addEventListener('click', async () => {
    if (busy || !window.confirm('Effacer vos coordonnées enregistrées ? Votre compte restera actif.')) return;
    setBusy(true);
    try {
      await api('client-profile', 'DELETE');
      populate(null);
      message('Vos coordonnées ont été supprimées de la base Netlify. Votre compte reste actif.');
    } catch (error) {
      message(error.message, true);
    } finally {
      setBusy(false);
    }
  });

  document.getElementById('clientLogout').addEventListener('click', async () => {
    if (busy) return;
    setBusy(true);
    try {
      await api('customer-auth', 'POST', { action: 'logout' });
      window.location.reload();
    } catch (error) {
      message(error.message, true);
      setBusy(false);
    }
  });

  async function initialize() {
    setBusy(true);
    try {
      const params = new URLSearchParams(window.location.hash.slice(1));
      const confirmationToken = params.get('confirmation_token');
      const inviteToken = params.get('invite_token');
      recoveryToken = inviteToken || params.get('recovery_token');
      if (confirmationToken || recoveryToken) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
        panel.scrollIntoView({ behavior: 'smooth' });
        if (confirmationToken) {
          await api('customer-auth', 'POST', { action: 'confirm', token: confirmationToken });
          setMode('login');
          message('E-mail confirmé. Vous pouvez maintenant vous connecter.');
        } else {
          setMode(inviteToken ? 'invite' : 'recover');
          message(inviteToken ? 'Choisissez un mot de passe pour accepter votre invitation Netlify Identity.' : 'Choisissez un nouveau mot de passe pour votre compte.');
        }
        return;
      }
      const data = await api('customer-auth');
      user = data.user;
      if (user) await loadProfile();
      else {
        setMode('login');
        message('L’espace client est facultatif : vous pouvez parcourir la boutique et commander sans vous connecter.');
      }
    } catch (error) {
      if (!user) setMode('login');
      message(error.message, true);
    } finally {
      setBusy(false);
    }
  }
  initialize();
})();
