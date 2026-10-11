export function products() {
  return new Map([
    ['Booster 30ᵉ Anniversaire', 5000],
    ['Booster Méga-Évolution – Règne Delta', 999],
    ['ETB 30ᵉ Anniversaire', 30000],
    ['ETB Méga-Évolution', 8500],
    ['Booster Méga-Évolution – Nuit Noire', 1000],
    ['ETB Méga-Évolution – Nuit Noire', 7500],
    ['ETB Rivalités Destinées', 15000],
    ['Booster 30ᵉ Anniversaire – Collection', 5000],
    ['Booster Méga-Évolution – Chaos Ascendant', 1000],
    ['ETB Origine Perdue – EB11', 50000],
    ['ETB Dracaufeu – Flammes Fantasmagoriques ME02', 30000],
    ['Coffret Premiers Partenaires – Série 2', 10000],
    ['Coffret Amphinobi – 30 ans', 10000],
    ['Coffret Fable Nébuleuse', 7500],
    ['Sleeves transparentes — paquet de 100', 499],
    ['Top loaders rigides — lot de 25', 399],
    ['Booster Pokémon japonais', 1000],
    ['Booster japonais premium', 1000],
    ['Booster Pokémon chinois', 1000],
    ['Booster chinois — collection', 1000],
    ['Display Pokémon français', 25000],
    ['Display Pokémon japonais', 25000]
  ]);
}

export function checkoutItems(items) {
  if (!Array.isArray(items) || !items.length || items.length > 30) {
    throw new Error('Le panier doit contenir entre 1 et 30 lignes.');
  }
  const catalog = products();
  const quantities = new Map();
  for (const item of items) {
    if (!item || typeof item.name !== 'string' || !catalog.has(item.name)) {
      throw new Error('Un produit du panier n’est pas disponible au paiement.');
    }
    if (!Number.isInteger(item.qty) || item.qty < 1 || item.qty > 20) {
      throw new Error('La quantité doit être un entier entre 1 et 20 par produit.');
    }
    const quantity = (quantities.get(item.name) || 0) + item.qty;
    if (quantity > 20) throw new Error('La quantité maximale est de 20 par produit.');
    quantities.set(item.name, quantity);
  }
  return [...quantities].map(([name, quantity]) => ({
    quantity,
    price_data: {
      currency: 'eur',
      unit_amount: catalog.get(name),
      product_data: { name }
    }
  }));
}
