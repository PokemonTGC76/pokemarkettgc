# Connexion administrateur

L’espace administrateur utilise Netlify Identity. Le serveur vérifie la session, la confirmation de l’adresse e-mail et le rôle `admin` avant d’autoriser l’ouverture du panneau. Le rôle peut être présent dans la liste des rôles applicatifs (`app_metadata.roles`) ou dans le rôle du compte (`role`), tous deux contrôlés côté serveur. L’adresse e-mail seule ne confère aucun droit et les métadonnées modifiables par un client ne sont pas utilisées pour l’autorisation.

Si la session ne contient pas les informations de confirmation, le serveur consulte la fiche complète du compte dans Identity avant de décider de l’accès. Une indisponibilité de cette vérification produit un message temporaire, sans accorder de droits ni présenter le compte comme non administrateur.

L’espace est masqué par défaut. Le bouton rond avec une icône de cadenas dans l’en-tête affiche la connexion et les outils d’administration autorisés. Le bouton « Fermer » ou la touche Échap depuis cet espace le masque à nouveau. Le lien `#admin` permet aussi de l’ouvrir directement et conserve l’espace visible après la connexion. Ce masquage visuel ne change pas les contrôles de session et de rôle.

Sur mobile, les liens de navigation sont masqués, mais le bouton cadenas reste visible et utilisable. L’en-tête peut passer sur deux lignes sur les petits écrans pour ne pas couper ce bouton.

Le bouton flottant du panier est placé en bas à droite pour ne pas recouvrir le cadenas dans l’en-tête.

## Activer le compte demandé

Le compte doit être activé et disposer du rôle `admin`. Si ces deux conditions sont déjà remplies, aucune nouvelle invitation ni modification du mot de passe n’est nécessaire.

Dans le projet **pokemarkettgc**, ouvrir **Identity** dans le tableau de bord Netlify. Rechercher `Bryandu76@live.fr`. Si le compte n’existe pas, utiliser **Invite users** avec cette adresse. Si une invitation a déjà été envoyée, ouvrir le lien reçu dans cette boîte e-mail pour terminer l’activation.

Le destinataire doit suivre ce lien et saisir le mot de passe souhaité dans le formulaire **Activer le compte invité** affiché sur le site, puis valider. Le mot de passe est défini dans Netlify Identity ; il ne doit pas être ajouté aux fichiers du projet ni prérempli dans le formulaire de connexion.

Ouvrir ensuite la fiche du compte dans Identity, ajouter `admin` au champ **Roles** et enregistrer. Se connecter à l’espace administrateur du site avec cette adresse et son mot de passe. Après toute modification de rôle, se déconnecter puis se reconnecter pour renouveler la session.

La création du premier administrateur et l’attribution de son rôle nécessitent cette intervention dans le tableau de bord Netlify. Aucun mot de passe ni rôle administrateur n’est créé automatiquement dans le code.

Pour un compte déjà activé, utiliser **Mot de passe oublié** dans l’espace administrateur. Le lien reçu permet de définir un nouveau mot de passe sans modifier le code du site.

## Session et limites

La session est partagée avec l’espace client. La déconnexion de l’un déconnecte l’autre. Le bouton de récupération du mot de passe envoie le lien Netlify Identity ; le formulaire de l’espace client traite ce lien.

Cette intégration sécurise l’authentification. Le catalogue ajouté localement reste la fonctionnalité existante du navigateur : il n’est ni partagé entre appareils ni enregistré sur le serveur, et les commandes et la gestion globale des clients restent à connecter. Le masquage du panneau ne remplace pas une autorisation serveur : toute future API d’administration doit vérifier la session et le rôle avant de lire ou de modifier des données. Le catalogue serveur et Stripe Checkout n’ont pas été modifiés.
