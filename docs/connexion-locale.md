# Essayer les comptes localement

1. Ouvrir http://127.0.0.1:3100/connexion.
2. Saisir une adresse fictive, par exemple `pilote@example.test`, puis demander un lien.
3. Ouvrir la boîte locale http://127.0.0.1:58025 et le message correspondant.
4. Cliquer sur le lien personnel (5 minutes, un seul usage). Le compte est créé à cette première connexion, sans accès automatique à une association.
5. Dans Mon espace, créer une association. Dans Équipe, inviter une seconde adresse fictive en choisissant séparément ses métiers et permissions.
6. Pour tester le second compte, se déconnecter puis demander un lien pour l'adresse invitée. Revenir ensuite sur le lien d'invitation présent dans la boîte de test et accepter explicitement.

Pour une action d'administration après cinq minutes, demander un nouveau lien de connexion. Une invitation est valable 48 heures. Le retrait d'un membre invalide toutes ses sessions ComÉternel ; il pourra se reconnecter aux autres associations dont il est encore membre.

Les messages restent sur cet ordinateur. N'importe quel utilisateur du poste ayant accès à Mailpit peut lire les messages de test : utiliser des identités fictives et aucune donnée sensible.

## Installation et démarrage

Dans le dossier application, après la configuration PostgreSQL E1 :

```sh
npm ci
npm run auth:setup
docker compose up -d --wait
npm run db:migrate
npm run build
npm start -- --port 3100
```

`auth:setup` ajoute un secret aléatoire à `.env.local`, le conserve s'il existe et ne l'affiche pas. Ne pas remplacer ce fichier lors d'une mise à jour. Une nouvelle installation doit d'abord copier `.env.example` en `.env.local`.

## Retrouver un ancien espace E1

Les espaces antérieurs n'avaient pas de propriétaire. Ils sont conservés, mais restent invisibles aux comptes tant qu'une attribution explicite n'a pas été faite. Sur le poste local, un opérateur peut lister leurs identifiants :

```sh
docker compose exec -T db psql -U cometernel -d cometernel -c 'SELECT id, name FROM organizations WHERE NOT EXISTS (SELECT 1 FROM members WHERE members.organization_id = organizations.id);'
```

Après avoir créé le compte voulu par connexion, attribuer l'espace précis :

```sh
npm run auth:assign-space -- --organization IDENTIFIANT_ESPACE --email ADRESSE_DU_COMPTE
```

La commande refuse les espaces déjà attribués et les comptes non vérifiés. Elle conserve les données et journalise l'attribution. Choisir explicitement l'espace et l'adresse ; ne pas utiliser une identité fictive pour un futur pilote réel.

## Google

Configurer `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET` côté serveur puis redémarrer. L'URI de retour correspond à `BETTER_AUTH_URL` suivi de `/api/auth/callback/google`. La connexion sera à vérifier avec un compte de test autorisé. Aucun accès Drive n'est demandé par cette connexion. Aucune configuration Google Cloud n'a été créée pendant E3.

## Régression

`npm test`, `npm run test:integration`, `npm run build`. La base dédiée doit porter le suffixe `_test` et être différente de la base applicative. Les tests de connexion utilisent uniquement cette base et un adaptateur de messages en mémoire ; les requêtes de consommation utilisent des adresses de test distinctes pour ne pas confondre usage unique et limiteur, testé séparément.
