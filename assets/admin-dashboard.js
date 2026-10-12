(function () {
  const $ = id => document.getElementById(id);
  const status = $('adStatus');
  const euro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
  const date = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
  const loaded = {};
  let stockItems = [];
  let clients = [];
  let nextOrder = null;

  function message(text, error = false) {
    status.textContent = text;
    status.dataset.error = String(error);
  }

  function cell(text, className) {
    const td = document.createElement('td');
    td.textContent = text;
    if (className) td.className = className;
    return td;
  }

  function emptyRow(tbody, columns, text) {
    const tr = document.createElement('tr');
    const td = cell(text, 'ad-empty');
    td.colSpan = columns;
    tr.append(td);
    tbody.replaceChildren(tr);
  }

  async function api(endpoint, options = {}) {
    const response = await fetch('/.netlify/functions/' + endpoint, {
      credentials: 'same-origin',
      cache: 'no-store',
      ...options,
      headers: options.body ? { 'Content-Type': 'application/json' } : {}
    });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401 || response.status === 403) showLogin(data.error);
    if (!response.ok) throw new Error(data.error || 'Service indisponible. Réessayez plus tard.');
    return data;
  }

  function showLogin(text) {
    $('adDashboard').hidden = true;
    $('adLogout').hidden = true;
    $('adUser').textContent = '';
    $('adLogin').hidden = false;
    message(text || 'Connectez-vous pour accéder à l’administration.', Boolean(text));
  }

  async function checkSession() {
    try {
      const data = await api('admin-auth');
      $('adLogin').hidden = true;
      $('adDashboard').hidden = false;
      $('adLogout').hidden = false;
      $('adUser').textContent = data.user.email;
      message('');
      selectTab(document.querySelector('.ad-tabs [aria-selected=true]').id.slice(4));
    } catch (error) {
      if ($('adLogin').hidden) showLogin(error.message);
    }
  }

  // Tabs
  const tabs = [...document.querySelectorAll('.ad-tabs [role=tab]')];
  function selectTab(name) {
    tabs.forEach(tab => {
      const active = tab.id === 'tab-' + name;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      $(tab.getAttribute('aria-controls')).hidden = !active;
    });
    if (!loaded[name]) {
      loaded[name] = true;
      ({ stock: loadStock, orders: () => loadOrders(), clients: loadClients })[name]();
    }
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab.id.slice(4)));
    tab.addEventListener('keydown', event => {
      const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
      if (!step) return;
      const next = tabs[(index + step + tabs.length) % tabs.length];
      next.focus();
      selectTab(next.id.slice(4));
    });
  });

  // Stocks
  function stockBadge(quantity) {
    const badge = document.createElement('span');
    badge.className = 'ad-badge ' + (quantity === null ? '' : quantity === 0 ? 'out' : quantity <= 1 ? 'low' : 'ok');
    badge.textContent = quantity === null ? 'Non défini' : quantity === 0 ? 'Rupture' : String(quantity);
    return badge;
  }

  function renderStock() {
    const tbody = $('stockRows');
    const filter = $('stockFilter').value.trim().toLowerCase();
    const items = stockItems.filter(item => item.name.toLowerCase().includes(filter));
    if (!items.length) return emptyRow(tbody, 4, 'Aucun produit.');
    tbody.replaceChildren(...items.map(item => {
      const tr = document.createElement('tr');
      const current = document.createElement('td');
      current.append(stockBadge(item.quantity));
      const edit = document.createElement('td');
      const form = document.createElement('form');
      form.className = 'ad-stock-form';
      const input = document.createElement('input');
      input.type = 'number';
      input.min = '0';
      input.max = '100000';
      input.step = '1';
      input.required = true;
      input.value = item.quantity ?? '';
      input.setAttribute('aria-label', 'Nouvelle quantité pour ' + item.name);
      const save = document.createElement('button');
      save.className = 'ad-btn small';
      save.type = 'submit';
      save.textContent = 'Enregistrer';
      const note = document.createElement('span');
      note.className = 'ad-saved';
      note.setAttribute('aria-live', 'polite');
      form.append(input, save, note);
      form.addEventListener('submit', async event => {
        event.preventDefault();
        save.disabled = true;
        note.textContent = '';
        try {
          const data = await api('admin-stock', {
            method: 'PUT',
            body: JSON.stringify({ name: item.name, quantity: Number(input.value) })
          });
          stockItems = data.items;
          renderStock();
          message('Stock de « ' + item.name + ' » mis à jour : ' + input.value + '.');
        } catch (error) {
          note.dataset.error = 'true';
          note.textContent = error.message;
          save.disabled = false;
        }
      });
      edit.append(form);
      tr.append(cell(item.name), cell(euro.format(item.price / 100), 'num'), current, edit);
      return tr;
    }));
  }

  async function loadStock() {
    emptyRow($('stockRows'), 4, 'Chargement des stocks…');
    try {
      stockItems = (await api('admin-stock')).items;
      renderStock();
    } catch (error) {
      loaded.stock = false;
      emptyRow($('stockRows'), 4, error.message);
    }
  }
  $('stockFilter').addEventListener('input', renderStock);

  // Orders
  const orderStatus = {
    paid: ['Payée', 'ok'], unpaid: ['Non payée', 'low'], no_payment_required: ['Sans paiement', '']
  };

  async function loadOrders(append = false) {
    const tbody = $('orderRows');
    const more = $('ordersMore');
    more.disabled = true;
    if (!append) {
      nextOrder = null;
      emptyRow(tbody, 5, 'Chargement des commandes…');
    }
    try {
      const data = await api('admin-orders' + (append && nextOrder ? '?after=' + encodeURIComponent(nextOrder) : ''));
      if (!append) tbody.replaceChildren();
      for (const order of data.orders) {
        const tr = document.createElement('tr');
        const client = document.createElement('td');
        client.append(order.name || '—', document.createElement('br'), order.email);
        if (order.address) {
          const address = document.createElement('div');
          address.className = 'ad-muted';
          address.textContent = order.address;
          client.append(address);
        }
        const items = document.createElement('td');
        const list = document.createElement('ul');
        list.className = 'ad-items';
        order.items.forEach(item => {
          const li = document.createElement('li');
          li.textContent = item.quantity + ' × ' + item.name;
          list.append(li);
        });
        items.append(list);
        const state = document.createElement('td');
        const [label, tone] = order.status === 'expired'
          ? ['Expirée', 'out']
          : orderStatus[order.paymentStatus] || [order.paymentStatus, ''];
        const badge = document.createElement('span');
        badge.className = 'ad-badge ' + tone;
        badge.textContent = label;
        state.append(badge);
        const amount = order.amount === null ? '—'
          : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: order.currency || 'eur' }).format(order.amount / 100);
        tr.append(cell(date.format(new Date(order.created * 1000)), 'num'), client, items, cell(amount, 'num'), state);
        tbody.append(tr);
      }
      if (!tbody.children.length) emptyRow(tbody, 5, 'Aucune commande pour le moment.');
      nextOrder = data.next;
      more.hidden = !nextOrder;
    } catch (error) {
      if (!append) {
        loaded.orders = false;
        emptyRow(tbody, 5, error.message);
      } else {
        message(error.message, true);
      }
    } finally {
      more.disabled = false;
    }
  }
  $('ordersRefresh').addEventListener('click', () => loadOrders());
  $('ordersMore').addEventListener('click', () => loadOrders(true));

  // Clients
  function renderClients() {
    const tbody = $('clientRows');
    const filter = $('clientFilter').value.trim().toLowerCase();
    const list = clients.filter(c => [c.prenom, c.nom, c.email, c.tel, c.adresse].join(' ').toLowerCase().includes(filter));
    $('clientCount').textContent = '(' + clients.length + ')';
    if (!list.length) return emptyRow(tbody, 5, clients.length ? 'Aucun client ne correspond.' : 'Aucun client inscrit.');
    tbody.replaceChildren(...list.map(c => {
      const tr = document.createElement('tr');
      const email = document.createElement('td');
      const link = document.createElement('a');
      link.href = 'mailto:' + c.email;
      link.textContent = c.email;
      email.append(link);
      tr.append(cell(c.prenom + ' ' + c.nom), email, cell(c.tel || '—', 'num'), cell(c.adresse),
        cell(date.format(new Date(c.createdAt)), 'num'));
      return tr;
    }));
  }

  async function loadClients() {
    emptyRow($('clientRows'), 5, 'Chargement des clients…');
    try {
      clients = (await api('admin-clients')).clients;
      renderClients();
    } catch (error) {
      loaded.clients = false;
      emptyRow($('clientRows'), 5, error.message);
    }
  }
  $('clientFilter').addEventListener('input', renderClients);

  // Session
  $('adLoginForm').addEventListener('submit', async event => {
    event.preventDefault();
    const buttons = event.target.querySelectorAll('button');
    buttons.forEach(b => { b.disabled = true; });
    message('Vérification du compte administrateur…');
    try {
      await api('admin-auth', {
        method: 'POST',
        body: JSON.stringify({ action: 'login', email: $('adEmail').value.trim(), password: $('adPassword').value })
      });
      await checkSession();
    } catch (error) {
      message(error.message, true);
    } finally {
      $('adPassword').value = '';
      buttons.forEach(b => { b.disabled = false; });
    }
  });

  $('adForgot').addEventListener('click', async () => {
    if (!$('adEmail').reportValidity()) return;
    try {
      await api('customer-auth', {
        method: 'POST',
        body: JSON.stringify({ action: 'recovery-request', email: $('adEmail').value.trim() })
      });
      message('Si ce compte existe, un lien de réinitialisation a été envoyé par e-mail.');
    } catch (error) {
      message(error.message, true);
    }
  });

  $('adLogout').addEventListener('click', async () => {
    try {
      await api('admin-auth', { method: 'POST', body: JSON.stringify({ action: 'logout' }) });
    } catch {}
    Object.keys(loaded).forEach(key => delete loaded[key]);
    showLogin();
  });

  checkSession();
})();
