# Espace client et Netlify

La boutique, le panier et Stripe Checkout sont accessibles sans identification à l’entrée. L’espace client en bas de page est facultatif et permet de retrouver les coordonnées depuis un autre appareil après connexion.

Netlify Identity gère les comptes et les mots de passe via `@netlify/identity`. La création de compte nécessite la confirmation de l’e-mail lorsque la configuration Identity l’exige. Les liens de confirmation et de récupération sont traités dans l’espace client. Après confirmation ou réinitialisation, le client se connecte pour ouvrir sa session.

Les coordonnées sont enregistrées côté serveur avec `@netlify/database`, dans `client_profiles`. Chaque profil est associé à l’identifiant Identity vérifié côté serveur. Les appels à `client-profile` ne permettent de consulter, modifier ou supprimer que le profil de l’utilisateur connecté. L’e-mail provient du compte authentifié et non de la requête client. Les mots de passe et données bancaires ne sont pas enregistrés dans cette table.

La migration dans `netlify/database/migrations/` est appliquée automatiquement par Netlify lors du déploiement. Elle ne doit pas être exécutée manuellement. Le marqueur de fonctionnalité active Netlify Identity lors du déploiement. La configuration d’inscription et les e-mails transactionnels restent gérés dans les paramètres Identity du site.

Les anciens profils présents uniquement dans le stockage local d’un navigateur ne sont pas importés automatiquement : ils n’étaient associés à aucun compte vérifié. Les clients doivent créer un compte puis enregistrer leurs coordonnées dans l’espace client. L’effacement des coordonnées ne supprime pas le compte Identity.

Après publication, vérifier la création de compte, la réception de l’e-mail de confirmation, la connexion, la sauvegarde et la récupération du profil sur un autre navigateur. Vérifier également la réinitialisation du mot de passe, la suppression des coordonnées et l’impossibilité d’accéder au profil d’un autre compte. Le parcours Stripe reste indépendant et n’a pas été modifié.
