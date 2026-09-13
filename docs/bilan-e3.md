# Livraison E3 locale — 13 septembre 2026

## Demande et interface

L'utilisateur a demandé le logo sans texte adjacent, un système de badges commun et a confirmé explicitement le passage à E3. Le logo garde un nom accessible sur son lien. Les badges utilisent un seul composant et cinq variantes sémantiques documentées dans `design-system.md`.

## Livré

- Better Auth avec sessions PostgreSQL, lien email hashé à usage unique (5 minutes), cookie de session, déconnexion, limitation persistante des requêtes et protection d'origine.
- Transport SMTP de test local Mailpit. Le formulaire ne présente jamais un message local comme un email reçu dans une vraie boîte.
- Connexion Google câblée mais désactivée en l'absence de configuration ; fusion automatique de comptes désactivée, jetons OAuth chiffrés par la bibliothèque. Connexion personnelle distincte du Drive futur.
- Compte et liste des seules organisations accessibles. Création d'organisation et appartenance administrateur dans une transaction.
- Anciennes organisations E1 conservées sans attribution automatique. Une commande d'attribution explicite est fournie, non exécutée sur les données utilisateur.
- Invitations nominatives avec jeton hashé, validité de 48 heures, acceptation explicite par le même email vérifié, révocation, verrouillage concurrent et journal sans jetons.
- Huit métiers cumulables ; permissions distinctes ; administrateur sans validation implicite. Formulaires d'invitation et de modification d'accès.
- Retrait d'accès : appartenance révoquée, sessions du compte invalidées, anciens droits projet effacés, invitations pendantes de cet email révoquées et revue des accès externes signalée dans l'interface et le journal.
- Dernier administrateur protégé ; administration exigeant une session créée depuis moins de cinq minutes. Cela constitue une réauthentification, pas une MFA.
- Primitives de contrôle par projet avec permission nominative ET portée projet. Leur interface d'attribution et leur rattachement aux projets réels sont prévus avec E4 ; aucun projet métier n'existe encore.

## Preuves exécutées

`npm test` : 2 tests de règles réussis. `npm run test:integration` : 2 scénarios PostgreSQL réussis, dont un scénario E3 couvrant :

- Création de vraies sessions Better Auth sur la base de test, expiration et rejeu du lien refusés ; deux consommations concurrentes produisent une seule session.
- Deux organisations isolées dans les lectures et invitations ; compte sans appartenance refusé ; membre ordinaire incapable d'inviter un administrateur.
- Invitation d'un autre email refusée, invitation expirée/révoquée refusée, double acceptation concurrente limitée à une.
- Permission projet correcte acceptée, autre projet/autre organisation refusés ; métier validateur et rôle administrateur sans droit de validation implicite.
- Reconnexion récente exigée, dernier administrateur conservé, modification d'un membre d'une autre organisation refusée.
- Retrait d'accès invalidant la session ouverte, supprimant les droits de projet et empêchant la réutilisation d'une invitation antérieure.
- Trois demandes email acceptées et la quatrième limitée (429), origine étrangère refusée (403).

Le test E1 sur migration/rejeu/persistance et contraintes passe après la nouvelle migration. TypeScript et build complet passent. Audit npm de production : aucune vulnérabilité signalée au contrôle. Un message synthétique sans secret a été accepté par SMTP local. Le scénario d'authentification automatisé capture les messages en mémoire ; il ne prétend pas tester la livraison externe.

## Limites et statut

E3 locale codée, contrôles serveur réussis. Google réel non testé (identifiants absents). Email externe volontairement absent : un adaptateur réel et son autorisation restent nécessaires. MFA non implémentée ; la protection actuelle exige une reconnexion récente. Les tests de parcours navigateur, lecteur d'écran et téléphone restent non réalisés, l'outil navigateur ayant été bloqué lors des étapes précédentes. Aucun contournement.

Les contrôles par projet portent sur des identifiants synthétiques : les projets E4 et les fichiers E6 n'existent pas encore, donc aucun test d'accès aux fichiers n'est revendiqué. La commande d'attribution des anciens espaces est compilée mais son parcours réel n'a pas été exercé. Aucun ancien espace n'est supprimé ni revendiqué automatiquement.

Usage local uniquement. La boîte Mailpit permet d'essayer des identités fictives et n'est pas une preuve d'identité extérieure. Ne pas exposer ce mode sur un réseau ; les scripts lient application, SMTP et boîte de test à 127.0.0.1. Le limiteur local partage la même adresse pour les requêtes et ignore les en-têtes IP fournis par les clients. Un futur hébergement devra configurer et tester son proxy de confiance.

E3 ne vaut pas validation de mise en production. Revue utilisateur et essais réels en attente ; E4 non engagé.
