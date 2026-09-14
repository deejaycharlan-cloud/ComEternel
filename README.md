# ComÉternel — La communication au service du Christ

Application Next.js pour organiser les événements d’une association, attribuer les rôles, inviter les membres et préparer les contenus à publier.

## Installation locale

Prérequis : Node.js 22, npm et PostgreSQL (Docker Compose fourni).

```sh
npm ci
cp .env.example .env.local
npm run auth:setup
docker compose up -d --wait
npm run db:migrate
npm run dev -- --port 3100
```

Ouvrir http://127.0.0.1:3100. Copier l’exemple de configuration uniquement à la première installation. Ne jamais remplacer une configuration existante ni versionner `.env.local`.

## Hébergement

La version publique utilise GitHub, Vercel, PostgreSQL Supabase et Brevo SMTP. Voir [le guide Vercel](docs/deploiement-vercel.md). Les secrets sont configurés dans l’hébergeur ; `.env.example` contient uniquement des exemples locaux et des champs vides.

Appliquer les migrations SQL avant de déployer la version qui les utilise. Conserver le stockage privé S3 pour les fichiers déjà reçus. Ne pas supprimer un volume, une base ou un ancien fichier lors d’une mise à jour.

## Google Drive et n8n

Chaque association connecte son propre compte Google depuis Réglages. Le compte de connexion à ComÉternel peut être différent. Aucun compte Google du développeur n’est utilisé par défaut.

Le navigateur envoie les fichiers par fragments directement dans Drive. ComÉternel vérifie leur taille et leur empreinte, puis signale à n8n qu’un classement est disponible. n8n appelle l’application pour classer le fichier avec la connexion de la bonne association ; ni le fichier complet ni les identifiants Google ne transitent dans le workflow.

Classement : année → date et nom de l’événement → Rushs ou Livrables → Photos, Vidéos ou Documents. Les droits de publication restent distincts de la réception privée des fichiers.

Voir [la configuration Drive et la recette](docs/drive-direct.md). Cette évolution doit être validée sur un véritable gros fichier et sur téléphone avant livraison ; les tests simulés ne prouvent pas la réussite d’un transfert réel.

## Vérifications

```sh
npm test
npm run build
npm run typecheck
npm run test:integration
```

Les tests d’intégration exigent une base dédiée dont le nom se termine par `_test`, différente de la base applicative. Ils n’utilisent pas les données de production. Les tests utiles restent dans le dépôt ; les fichiers temporaires et les secrets en sont exclus.

Les documents de pilote et bilans locaux sont historiques. Ils ne décrivent pas l’état de la version hébergée. Les procédures de sauvegarde locales restent disponibles dans [le guide d’exploitation](docs/exploitation-locale.md).
