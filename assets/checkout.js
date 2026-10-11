(function () {
  let submitting = false;
  let attempt = null;
  const button = document.getElementById('stripePayMain');
  const status = document.getElementById('stripePaymentStatus');

  function message(text, isError = false) {
    status.textContent = text;
    status.style.color = isError ? '#be123c' : '#475467';
  }

  async function checkout() {
    if (submitting) return;
    if (!Array.isArray(cart) || !cart.length) {
      message('Ton panier est vide. Ajoute un produit avant de payer.', true);
      return;
    }
    const items = cart.map(item => ({ name: item.name, qty: item.qty }));
    const fingerprint = JSON.stringify(items);
    if (!attempt || attempt.fingerprint !== fingerprint) {
      attempt = { fingerprint, key: crypto.randomUUID() };
    }
    submitting = true;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    button.textContent = 'Ouverture du paiement sécurisé…';
    message('Connexion à Stripe. Ne ferme pas cette page.');
    try {
      const response = await fetch('/.netlify/functions/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': attempt.key },
        body: JSON.stringify({ items, idempotencyKey: attempt.key })
      });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.error || 'Impossible de créer le paiement.');
      const destination = new URL(data.url);
      if (destination.protocol !== 'https:' || destination.hostname !== 'checkout.stripe.com') {
        throw new Error('Adresse de paiement invalide. Contacte la boutique.');
      }
      window.location.assign(destination.href);
    } catch (error) {
      message(error.message || 'Le paiement est indisponible. Réessaie.', true);
      submitting = false;
      button.disabled = false;
      button.removeAttribute('aria-busy');
      button.textContent = 'Payer avec Stripe';
    }
  }

  window.pokemarketNetlifyCheckout = checkout;
  button.addEventListener('click', checkout);
  window.addEventListener('pageshow', function (event) {
    if (!event.persisted) return;
    submitting = false;
    button.disabled = false;
    button.removeAttribute('aria-busy');
    button.textContent = 'Payer avec Stripe';
    message('Tu peux reprendre le paiement depuis ton panier.');
  });

  async function verifyReturn() {
    const parameters = new URLSearchParams(location.search);
    const payment = parameters.get('payment');
    if (!payment) return;
    const notice = document.createElement('div');
    notice.setAttribute('role', 'status');
    notice.setAttribute('aria-live', 'polite');
    notice.style.cssText = 'position:fixed;top:78px;left:50%;transform:translateX(-50%);width:min(540px,90vw);background:#241044;color:#fff;padding:14px 20px;border:1px solid #a855f7;border-radius:12px;z-index:10001';
    document.body.appendChild(notice);
    if (payment === 'cancel') {
      notice.textContent = 'Paiement annulé. Tu peux sélectionner tes produits et réessayer.';
      return;
    }
    const sessionId = parameters.get('session_id');
    if (payment !== 'success' || !sessionId) {
      notice.textContent = 'Le paiement n’a pas pu être vérifié. Contacte la boutique en cas de débit.';
      return;
    }
    notice.textContent = 'Vérification du paiement auprès de Stripe…';
    try {
      const response = await fetch('/.netlify/functions/checkout-status?session_id=' + encodeURIComponent(sessionId));
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      notice.textContent = data.paid
        ? 'Paiement confirmé par Stripe. Merci pour ton achat !'
        : 'Le paiement n’est pas encore confirmé. Contacte la boutique avant de réessayer si tu as été débité.';
      if (data.paid) {
        cart.splice(0, cart.length);
        updateCartBadge();
      }
    } catch {
      notice.textContent = 'La confirmation du paiement est indisponible. Contacte la boutique en cas de débit.';
    }
  }

  verifyReturn();
})();
