# Préparation au déploiement — 13 septembre 2026

## État vérifié dans cette tâche

L’application Next.js et PostgreSQL existante est conservée. Aucune URL publique n’a été créée. GitHub est connecté, mais aucun dépôt ComEternel n’existe parmi les dépôts accessibles. GitHub Pages ne peut pas exécuter cette application serveur.

La tâche « Coder la première étape » modifie simultanément le thème, la navigation et l’intégration Drive/n8n. La recette finale doit être répétée après stabilisation de ces travaux ; les présents résultats ne certifient pas leurs modifications futures.

## Changements réalisés ici

- Transport SMTP authentifié, TLS obligatoire (465 ou 587), temporisations et erreurs sans affichage des secrets. Aucun email externe envoyé pendant les essais.
- Connexion et invitations utilisables avec SMTP ; messages distincts entre boîte locale et vraie messagerie. Acceptation SMTP ne signifie pas livraison dans la boîte du destinataire.
- Contrôles du démarrage public : origine HTTPS, secret d’authentification de 32 caractères minimum, SMTP et stockage S3. Le pilote local reste disponible.
- Dockerfile sans secrets ni fichiers privés locaux dans le contexte. L’image utilise un compte non privilégié. L’hébergement doit terminer HTTPS devant l’application.
- Commandes `check:deployment`, `start:public` et `db:migrate:public`. Aucune migration de production automatique au démarrage.
- Correction du fragment JSX non fermé dans le menu du compte.
- Initialisation de la session après lecture du contexte de requête : la compilation du conteneur ne réclame plus les secrets de production.

## Configuration attendue sur l’hébergement

Renseigner les valeurs réelles dans le gestionnaire de secrets du serveur, jamais dans GitHub :

| Usage | Variables |
| --- | --- |
| Application | COMETERNEL_DEPLOYMENT=public, BETTER_AUTH_URL=https://domaine, BETTER_AUTH_SECRET, PORT |
| PostgreSQL | DATABASE_URL (connexion chiffrée selon le fournisseur, compte limité à la base) |
| Email | AUTH_MAIL_MODE=smtp, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM |
| Stockage privé | STORAGE_DRIVER=s3, S3_BUCKET, S3_REGION, éventuellement S3_ENDPOINT et S3_FORCE_PATH_STYLE ; identité IAM du serveur ou AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY |

Les secrets du pilote ne doivent pas être réutilisés. Le bucket doit refuser l’accès public. La présence des variables ne vérifie pas les politiques du bucket, les sauvegardes ou l’envoi d’emails.

`npm run check:deployment` valide la forme de la configuration. Appliquer les migrations avec `npm run db:migrate:public` uniquement après sauvegarde vérifiée et choix de la base cible. Ensuite `npm run start:public` écoute sur le port fourni, derrière HTTPS.

Ne pas simplement basculer STORAGE_DRIVER sur une base qui contient déjà des fichiers locaux : copier les objets avec leurs clés existantes, vérifier leurs empreintes et conserver la source avant la bascule. Aucun fichier métier n’a été déplacé ici.

## Tests réalisés

- 10 tests unitaires réussis, dont refus du mode email local en public, secret manquant, stockage local, origine non HTTPS, paramètres SMTP dangereux.
- 5 scénarios d’intégration réussis dans la base dédiée après les changements : identité/invitations, migrations/persistance, production, programme, travail. Ils ne testent pas un fournisseur externe.
- Vérification TypeScript et compilation Next.js réussies. Construction Docker complète réussie sans fichier de secrets ; image locale `cometernel-deployment-check:local`, non publiée. Le test des sessions a été rejoué avec succès après la correction d’initialisation.
- Conteneur démarré sans configuration : refus attendu avant ouverture du serveur (DATABASE_URL absente).
- Navigateur réel sur la version compilée, port de test 3102 : écran de connexion et demande de lien pour une adresse fictive acceptée en mode Mailpit. Aucun envoi externe.

## Conditions encore manquantes

- Hébergement serveur et budget à choisir. GitHub hébergera le code, pas ce serveur dynamique.
- Création du dépôt : le connecteur accessible ne propose pas cette opération ; la page de création GitHub demande une connexion navigateur.
- SMTP, S3 et PostgreSQL de production non fournis, aucun accès distant testé.
- `n8nac env status --json` : aucun environnement configuré. `n8n-manager instances list` : aucune instance enregistrée. La connexion n8n reste à établir ; sa préparation est en cours dans l’autre tâche.
- Tests finaux des rôles dans le navigateur, mobile, fichiers volumineux, sauvegarde/restauration distante, Drive/S3, emails réels et HTTPS après configuration.

Le dashboard complet, le workflow n8n et le déploiement ne sont pas déclarés terminés.
