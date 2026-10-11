# Paiements Stripe

Le panier ouvre Stripe Checkout pour un paiement en euros avec une adresse de livraison en France. Les prix sont définis côté serveur dans `netlify/lib/products.mjs`, jamais à partir d’un montant envoyé par le navigateur. Les produits ajoutés uniquement dans l’administration locale ne peuvent pas être payés tant qu’ils ne figurent pas dans ce catalogue serveur.

## Cohérence des tarifs

Lors d’un changement de prix dans la boutique, mettre aussi à jour le catalogue serveur en centimes et déployer les deux ensemble. Les montants envoyés à Stripe sont construits à partir de ce catalogue lors de la création de chaque session, et non d’un tarif enregistré manuellement dans le tableau de bord Stripe.

Les boosters « 30ᵉ Anniversaire » et « 30ᵉ Anniversaire – Collection » sont à 50 € chacun. Les ETB « 30ᵉ Anniversaire » et « 30ᵉ Anniversaire – Visuel Premium » sont à 300 € chacun. L’ETB « Origine Perdue – EB11 » est à 500 € et l’ETB « Dracaufeu – Flammes Fantasmagoriques ME02 » est à 300 €. Ces six références sont incluses dans le catalogue de paiement.

Après publication, recharger la boutique et ouvrir un nouveau paiement depuis le panier pour vérifier ces montants en mode test Stripe. Une page de paiement déjà ouverte conserve les montants de sa session précédente ; la correction du catalogue ne modifie pas les sessions ou paiements existants.

## Configuration Netlify

Configurer `STRIPE_SECRET_KEY` dans les variables d’environnement du projet Netlify, avec une portée incluant les Functions et les contextes de déploiement concernés. Ne jamais placer sa valeur dans le code, une clé publique, un fichier de documentation ou une conversation. Utiliser une clé de test pour les essais et une clé de production uniquement lors de l’ouverture réelle de la boutique. Redéployer après un changement de configuration.

La variable existante `STRIP_SECRET_KEY` est également acceptée pour assurer la compatibilité avec la configuration actuelle du projet. Si les deux noms existent, `STRIPE_SECRET_KEY` est prioritaire. La présence d’une variable ne garantit pas que sa clé est valide ou qu’elle est disponible dans tous les contextes et toutes les portées Netlify.

Stripe Checkout étant hébergé, aucune clé publique n’est nécessaire dans le navigateur. Activer les moyens de paiement souhaités dans le tableau de bord Stripe ; leur disponibilité dépend du compte et du client. Les retours utilisent l’adresse du site fournie par Netlify (`URL`), pas une adresse fournie par l’acheteur.

## Vérification

En mode test Stripe, ajouter un produit, ouvrir le panier, passer au paiement puis sélectionner « Payer avec Stripe ». Vérifier le montant et la quantité sur la page hébergée. Vérifier aussi une annulation et un paiement refusé. Le retour de succès n’affiche une confirmation qu’après vérification de la session côté serveur. Un simple paramètre `payment=success` ne constitue pas une preuve de paiement.

Les requêtes répétées pour le même panier dans la même page utilisent un identifiant d’idempotence commun. Les quantités invalides et les produits inconnus sont refusés. Aucun paiement réel n’a été effectué lors de la configuration.

Cet identifiant est transmis dans le corps JSON (`idempotencyKey`) et dans l’en-tête `Idempotency-Key`. La Function accepte le corps même si l’en-tête est absent, et reste compatible avec les clients qui envoient seulement l’en-tête. Si les deux sont présents, ils doivent être identiques. Un identifiant absent ou mal formé reste refusé avant tout appel à Stripe. Le script de paiement utilise une URL versionnée pour éviter de reprendre une ancienne version en cache après déploiement.

## Suivi des commandes

Cette intégration encaisse via Stripe Checkout et vérifie le paiement au retour. Elle n’automatise pas la préparation, l’expédition, le stock ou l’enregistrement des commandes dans une base applicative. Le tableau de bord Stripe reste nécessaire pour contrôler les paiements. Avant d’automatiser le traitement des commandes, ajouter un webhook Stripe signé et un suivi durable dans Netlify Database ; la page de retour seule ne suffit pas, car un acheteur peut ne jamais y revenir. Les frais de livraison et les règles fiscales ne sont pas ajoutés automatiquement par cette intégration.
