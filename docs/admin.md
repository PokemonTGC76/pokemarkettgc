# Connexion administrateur

L’espace administrateur utilise Netlify Identity. Le serveur vérifie la session, la confirmation de l’adresse e-mail et le rôle `admin` avant d’autoriser l’ouverture du panneau. L’adresse e-mail seule ne confère aucun droit et les métadonnées modifiables par un client ne sont pas utilisées pour l’autorisation.

L’espace est masqué par défaut. Le bouton rond avec une icône de cadenas dans l’en-tête affiche la connexion et les outils d’administration autorisés. Le bouton « Fermer » ou la touche Échap depuis cet espace le masque à nouveau. Le lien `#admin` permet aussi de l’ouvrir directement et conserve l’espace visible après la connexion. Ce masquage visuel ne change pas les contrôles de session et de rôle.

## Activer le compte demandé

Le compte demandé n’a pas encore été activé. Aucun mot de passe ne peut être utilisé pour la connexion administrateur tant que l’invitation n’a pas été acceptée et que le rôle `admin` n’a pas été attribué.

Dans le projet **pokemarkettgc**, ouvrir **Identity** dans le tableau de bord Netlify. Rechercher `Bryandu76@live.fr`. Si le compte n’existe pas, utiliser **Invite users** avec cette adresse. Si une invitation a déjà été envoyée, ouvrir le lien reçu dans cette boîte e-mail pour terminer l’activation.

Le destinataire doit suivre ce lien et saisir le mot de passe souhaité dans le formulaire **Activer le compte invité** affiché sur le site, puis valider. Le mot de passe est défini dans Netlify Identity ; il ne doit pas être ajouté aux fichiers du projet ni prérempli dans le formulaire de connexion.

Ouvrir ensuite la fiche du compte dans Identity, ajouter `admin` au champ **Roles** et enregistrer. Se connecter à l’espace administrateur du site avec cette adresse et son mot de passe. Après toute modification de rôle, se déconnecter puis se reconnecter pour renouveler la session.

La création du premier administrateur et l’attribution de son rôle nécessitent cette intervention dans le tableau de bord Netlify. Aucun mot de passe ni rôle administrateur n’est créé automatiquement dans le code.

Pour un compte déjà activé, utiliser **Mot de passe oublié** dans l’espace administrateur. Le lien reçu permet de définir un nouveau mot de passe sans modifier le code du site.

## Écran d’administration `/admin`

La page `/admin` est l’écran d’administration de la boutique. Elle demande une connexion avec un compte admin et propose trois onglets :

- **Stocks** : liste tous les produits du catalogue de paiement avec leur prix et leur stock. Chaque quantité peut être modifiée et enregistrée dans Netlify Database ; la boutique affiche aussitôt la nouvelle valeur. Les produits sans stock défini (par exemple les accessoires) apparaissent comme « Non défini » et peuvent recevoir une quantité.
- **Commandes** : liste les sessions Stripe Checkout créées par la boutique, avec la date, le client, l’adresse de livraison, les articles, le montant et le statut du paiement, 25 par page.
- **Clients** : liste les profils enregistrés depuis l’espace client, avec une recherche.

Chaque fonction (`admin-stock`, `admin-orders`, `admin-clients`) vérifie côté serveur la session, la confirmation de l’e-mail et le rôle `admin` avant de répondre. Les modifications vérifient aussi l’origine de la requête. La page n’est pas indexée par les moteurs de recherche. Les cartes du panneau caché de la page d’accueil mènent vers cet écran.

## Session et limites

La session est partagée avec l’espace client. La déconnexion de l’un déconnecte l’autre. Le bouton de récupération du mot de passe envoie le lien Netlify Identity ; le formulaire de l’espace client traite ce lien.

Cette intégration sécurise l’authentification. Le catalogue ajouté localement reste la fonctionnalité existante du navigateur : il n’est ni partagé entre appareils ni enregistré sur le serveur, Le masquage du panneau ne remplace pas une autorisation serveur : toute future API d’administration doit vérifier la session et le rôle avant de lire ou de modifier des données. Le catalogue serveur et Stripe Checkout n’ont pas été modifiés.
