# Déploiement sur Vercel

Importer le dépôt GitHub ComEternel, framework Next.js, dossier racine `.`, Node.js 22 ou supérieur compatible. Installation : `npm ci`. Compilation : `npm run build`.

## Services requis

- PostgreSQL distant (par exemple Supabase, avec une connexion adaptée à Vercel).
- Stockage S3 privé compatible pour les médias.
- Serveur SMTP pour les liens de connexion et les invitations.
- Application OAuth Google si la connexion Google est activée.

La connexion utilise Better Auth. Supabase peut fournir la base et le stockage ; Supabase Auth n'est pas utilisé par cette version.

## Variables

Recopier les noms de `.env.example` dans les variables Vercel, en remplaçant les exemples locaux. Ne jamais publier les secrets dans GitHub.

Configurer `COMETERNEL_DEPLOYMENT=public`, `OWNER_EMAIL` avec l'adresse vérifiée du propriétaire, `BETTER_AUTH_URL` avec l'origine HTTPS finale, `BETTER_AUTH_SECRET` avec un secret aléatoire d'au moins 32 caractères, `DATABASE_URL`, les variables SMTP et S3 indiquées dans l'exemple.

Pour Google, définir `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET` et autoriser le callback `https://VOTRE-DOMAINE/api/auth/callback/google` dans Google Cloud.

Exécuter les migrations avec `npm run db:migrate:public` dans un environnement sécurisé disposant de la connexion de production, puis redéployer. Les migrations ne s'exécutent pas automatiquement à la compilation.

## Administration

Seul le compte vérifié correspondant à `OWNER_EMAIL` peut initialiser une équipe en production. Les administrateurs invitent ensuite les membres et attribuent leurs permissions. Aucun compte administrateur partagé n'est fourni.

## Validation avant ouverture

Vérifier Google, liens email, invitations, refus d'accès entre équipes, dépôt et téléchargement de fichiers, sauvegardes et restauration sur les services réels. Les limites de taille et de durée Vercel doivent être vérifiées pour les médias volumineux. n8n nécessite son propre hébergement et sa configuration ; Google Drive n'est pas activé.

Les tests locaux et la compilation ne constituent pas une validation de ces services distants. Les données du site ChatGPT Sites ne sont pas migrées par ce dépôt.
