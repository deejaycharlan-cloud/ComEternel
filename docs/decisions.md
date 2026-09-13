# Décisions E1

La demande « code la premiere etape » autorise le premier lot de code (E1). Le cadrage E0 reste ouvert : aucune association, personne ou zone horaire métier n'est déduite du poste.

- Next.js App Router + TypeScript, exécution Node.js locale.
- PostgreSQL et Drizzle ORM : schéma typé, SQL de migration lisible et versionné, peu de génération implicite. Prisma est une alternative, non retenue pour garder les migrations et accès SQL directs lisibles.
- PostgreSQL Docker avec volume nommé et port limité à 127.0.0.1. Aucun hébergement créé.
- Tests : test runner Node via tsx, intégration contre une base PostgreSQL dédiée, compilation TypeScript et build Next.js ; contrôle navigateur local.
- Authentification différée à E3 : aucun faux compte ni permission simulée. Le socle écoute uniquement sur la boucle locale. Il ne doit pas être exposé sur un réseau avant E3.
- Traitements : table persistante préparée avec organisation, destination figée, clé d'idempotence par organisation, tentatives et prochaine exécution. Aucun worker métier activé avant les modules concernés.

Documentation vérifiée lors de l'initialisation :
- https://nextjs.org/docs/app/getting-started/installation
- https://orm.drizzle.team/docs/migrations
- https://orm.drizzle.team/docs/drizzle-kit-migrate

Les versions exactes sont figées dans package-lock.json. Les choix d'authentification et d'hébergement seront revus aux étapes concernées.

Contrôle des dépendances : override esbuild 0.25.12 pour retirer la version transitive vulnérable de drizzle-kit. La génération de migrations a été réexécutée avec succès ; aucun serveur esbuild n'est exposé.

## E3 — identité et autorisations

Accord explicite reçu pour E3. Better Auth est retenu pour les sessions et OAuth/lien email à usage unique, avec adaptateur Drizzle. Le module d'autorisations métier reste distinct, afin de conserver les organisations E1 et de séparer métiers, accès aux projets et validation. Aucune fusion automatique de comptes par email. Les opérations d'administration exigent une connexion de moins de cinq minutes (réauthentification) ; cela ne constitue pas une authentification à deux facteurs.

Les anciens espaces E1 sans propriétaire sont conservés et ne sont jamais attribués au premier connecté. Une commande locale d'attribution explicite est prévue. Les essais email utilisent une boîte SMTP locale clairement identifiée ; Google nécessite des identifiants OAuth et reste désactivé sans eux. Aucune émission d'email réelle n'est autorisée par ce lot.

Références officielles consultées : https://better-auth.com/docs/plugins/magic-link ; https://better-auth.com/docs/adapters/drizzle ; https://better-auth.com/docs/concepts/rate-limit ; https://better-auth.com/docs/authentication/google.

## E4 — programme et temps métier

Temporal avec polyfill pour distinguer date civile et instant, refuser les heures ambiguës et maintenir les heures locales à travers les récurrences. Sources officielles : https://tc39.es/proposal-temporal/docs/timezone.html ; https://tc39.es/proposal-temporal/docs/plaindatetime.html.

Séries finies hebdomadaires/mensuelles, occurrences stables, exceptions conservées lors d'un recalcul global, verrou d'organisation et révision optimiste. Demande reçue distincte de projet en préparation. Aucune acceptation de mission implicite. Les types d'événement se saisissent librement avec suggestions ; pas de catalogue liturgique prédéfini.
