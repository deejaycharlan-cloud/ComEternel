# Livraison E1 — 13 septembre 2026

## Résultat

Premier lot de code réalisé dans `com-eternel/application`, séparé des documents de planification et des références. La demande « code la premiere etape » autorise ce lot ; elle ne valide pas les choix métier encore ouverts en E0. Ce bilan décrit l'état actuel, les documents de préparation conservant leur état historique.

Livré : application Next.js en français, création d'un espace local avec validation nom/fuseau, lecture serveur depuis PostgreSQL, message explicite si la base manque, migrations SQL versionnées, configuration d'exemple, conteneur PostgreSQL avec volume persistant, squelette de traitements persistants, documentation et tests. En cas d'erreur d'enregistrement, le formulaire conserve ses valeurs contrôlées ; ce comportement reste à exercer dans le navigateur.

## Preuves exécutées

- Node.js 22.21.0 ; Next.js 16.3.5 ; React 19.3.0 ; Drizzle ORM 0.45.2 ; PostgreSQL image 17.6-alpine. Versions npm figées dans le verrou.
- `npm test` : 2 tests réussis (configuration sans divulgation de secret, validation des champs et fuseaux).
- `npm run test:integration` : 1 scénario réussi sur PostgreSQL réel, base dédiée : première migration, réapplication sans perte, relecture après fermeture/réouverture de connexion, rejet des traitements en double dans la même organisation, autorisation de la même clé dans une autre organisation, rejet d'un statut invalide et d'une organisation absente, suppression d'organisation refusée si traitement rattaché.
- Redémarrage réel du conteneur PostgreSQL : donnée synthétique écrite avant arrêt, retrouvée après redémarrage, puis nettoyée. Scripts `check-persistence.ts before/after` reproductibles.
- `npm run build` et `npm run typecheck` : réussis.
- Serveur compilé démarré à `http://127.0.0.1:3100` ; signal Ready observé. Cela ne prouve pas le parcours utilisateur.
- Audit npm : aucune vulnérabilité signalée après remplacement transitif d'esbuild par 0.25.12. Génération Drizzle retestée avec cet override ; aucun changement de schéma imprévu.

## Limites explicites

Le navigateur automatisé a refusé l'ouverture parce que la vérification de sa politique de sécurité était indisponible. Aucun contournement effectué. Contrôle visuel, soumission du formulaire, conservation des champs en erreur, mobile, clavier et lecteur d'écran : non exécutés. Le formulaire peut être essayé manuellement à l'adresse locale.

T17 est partiel : installation locale, migration initiale/rejeu et persistance contrôlées. Pas encore d'évolution entre deux versions métier, de retour arrière, de restauration complète démontrée, de quotas, de stockage privé ni d'exploitation de production. Le worker n'exécute aucun travail ; sa réservation concurrente et ses reprises restent à implémenter en E6.

Pas d'authentification ni de permissions E3 : usage réservé au poste local avec données non sensibles. Les contraintes de rattachement et de clés ne constituent pas une preuve d'isolation des accès entre organisations. Aucun service Google, email, S3 ou réseau social connecté. E0 reste à cadrer. E2 n'est pas engagé.

État : socle codé et contrôles techniques réussis ; validation visuelle et validation utilisateur en attente.
