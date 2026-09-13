# ComÉternel — application Next.js

Application française de préparation, collecte de fichiers et suivi éditorial. Le parcours local est disponible ; Google Drive est reporté. Voir [le guide de test](docs/guide-pilote.md), [le bilan et les limites](docs/bilan-final-local.md) et [la sauvegarde/restauration](docs/exploitation-locale.md).

## Démarrer

Prérequis : Node.js 22 ou version compatible supérieure, npm, Docker Desktop démarré. Dans ce dossier :

```sh
npm ci
cp .env.example .env.local
npm run auth:setup
docker compose up -d --wait
npm run db:migrate
npm run dev -- --port 3100
```

Ouvrir http://127.0.0.1:3100. Pour changer de port, adapter aussi `BETTER_AUTH_URL` dans `.env.local`.

Ne recopier `.env.example` qu'à la première installation : conserver ensuite votre configuration. Les identifiants de l'exemple sont réservés à cette base de développement, liée à la boucle locale. Ne pas y importer de données sensibles : le mode email local est réservé aux essais.

Pour la version compilée : `npm run build`, puis `npm start -- --port 3100`. L'application et PostgreSQL écoutent sur 127.0.0.1. Aucune publication n'est configurée.

## Vérifier

```sh
npm test
npm run build
npm run typecheck
docker compose exec -T db createdb -U cometernel cometernel_test
npm run test:integration
```

Créer la base de test une seule fois. Les tests refusent une URL sans suffixe `_test` ou identique à la base applicative. Ils créent puis suppriment uniquement leurs données synthétiques.

Essai de persistance : créer un espace, arrêter l'application, exécuter `docker compose restart db`, puis relancer l'application. Le même espace doit réapparaître. `docker compose stop` arrête la base sans supprimer son volume ; `docker compose up -d --wait` la relance. Ne pas utiliser l'option `down -v` : elle supprimerait le volume.

## Pilote et sauvegarde

Le pilote existant utilise une base et des fichiers séparés : `npm run pilot:local` sur http://localhost:3101. Les données principales restent sur http://127.0.0.1:3100.

`npm run backup:local` sauvegarde base principale et fichiers locaux. `npm run test:restore` vérifie la restauration du pilote dans une nouvelle base isolée. Consulter le guide d’exploitation avant toute récupération réelle.

Les bilans E1–E5 sont historiques. Aucun ancien espace n’a été supprimé. Aucune publication externe ni connexion Drive n’est activée.

## Hébergement Vercel

Importer ce dépôt avec le framework Next.js et le dossier racine `.`. Consulter [le guide Vercel](docs/deploiement-vercel.md). Ce dépôt contient exclusivement la version Next.js, sans la version ChatGPT Sites ni les données locales.
