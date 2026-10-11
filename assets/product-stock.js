(() => {
  const cards = [...document.querySelectorAll('#boutique .card:not([data-admin-product])')];
  const labels = cards.map(card => {
    const label = document.createElement('p');
    label.className = 'product-stock';
    label.dataset.state = 'loading';
    label.setAttribute('aria-live', 'polite');
    label.textContent = '📦 Chargement du stock…';
    card.querySelector('.price').insertAdjacentElement('afterend', label);
    return { name: card.querySelector('h4').textContent.trim(), label };
  });

  function showUnknown(label) {
    label.dataset.state = 'unknown';
    label.textContent = '📦 Stock à confirmer';
  }

  async function loadStocks() {
    try {
      const response = await fetch('/.netlify/functions/product-stock', { cache: 'no-store' });
      if (!response.ok) throw new Error('stock-unavailable');
      const data = await response.json();
      if (!Array.isArray(data.stocks)) throw new Error('invalid-stock');
      for (const { name, label } of labels) {
        const stock = data.stocks.find(item => item?.name === name);
        if (!Number.isInteger(stock?.quantity) || stock.quantity < 0) {
          showUnknown(label);
          continue;
        }
        label.dataset.state = stock.quantity === 0 ? 'empty' : stock.quantity === 1 ? 'low' : 'available';
        label.textContent = `📦 Stock : ${stock.quantity}${stock.quantity === 0 ? ' — Rupture de stock' : ''}`;
      }
    } catch {
      labels.forEach(({ label }) => showUnknown(label));
    }
  }

  loadStocks();
})();
