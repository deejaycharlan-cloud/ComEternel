# Drive direct : configuration et recette

## Configuration

1. Appliquer la migration `0011_shallow_spectrum.sql` avec les migrations antérieures. Les nouvelles tables utilisent RLS ; les jetons Google et les URL de session sont chiffrés par le serveur.
2. Conserver `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `BETTER_AUTH_SECRET` et `BETTER_AUTH_URL` dans les secrets serveur. Ajouter au client OAuth Google la redirection `https://votre-domaine/api/google-drive/callback`.
3. Autoriser le périmètre Google `drive.file`, en plus de l’identité email. Il permet de travailler avec les fichiers créés par cette application. L’administrateur choisit explicitement le compte Drive de son association.
4. Publier le workflow de classement et configurer `N8N_DIRECT_DRIVE_WEBHOOK_URL` ainsi que `N8N_SERVICE_TOKEN`. Ce dernier authentifie les échanges serveur avec n8n ; ne jamais le mettre dans le navigateur ou dans un export de workflow.
5. Connecter Drive dans Réglages. L’application crée son dossier et un sous-dossier de réception. Une reconnexion conserve le même compte pour ne pas perdre l’accès aux fichiers déjà reçus.

## Fonctionnement

Fragments de 8 Mio ; empreinte SHA-256 calculée sans charger le fichier entier en mémoire. Après interruption, sélectionner le même fichier sur le même navigateur. La confirmation serveur contrôle le compte de l’association, la taille, l’empreinte et le dossier. Une session expirée vérifie d’abord si le fichier a déjà été reçu, afin d’éviter les doublons.

Le webhook réveille n8n ; une relève périodique reprend les signaux manqués. Un travail reçoit un verrou temporaire et cinq tentatives de classement au maximum. Un fichier dont le classement échoue reste dans Drive. Les identifiants de travail ne donnent pas accès aux comptes des autres associations.

La connexion Google exige un administrateur toujours actif dans l’association. Un membre standard dépose uniquement des rushs. Le transfert de propriété vers un autre compte Google n’est pas automatique.

## Recette avant livraison

- Tests d’intégration : isolation entre associations, droits du membre standard, reprise, refus d’une empreinte différente, absence de doublon et classement idempotent.
- Vérifier en production un petit fichier puis des fichiers réels de 200 Mo, 500 Mo et 1 Go ; comparer leur taille et leur empreinte.
- Interrompre le réseau, reprendre et confirmer qu’une seule copie est présente.
- Tester iPhone/Safari et Android/Chrome avec photothèque et fichiers locaux/cloud.
- Tester deux associations connectées à deux comptes Google distincts.
- Vérifier le signal n8n, le classement et la reprise après indisponibilité temporaire.

À ce stade, les tests automatisés simulent Google et déclarent une taille de 1 Go : ils ne constituent pas un transfert réel de 1 Go. Garder la page ouverte durant l’envoi ; la mise en veille du téléphone peut interrompre le transfert. L’espace disponible et les quotas Google restent applicables.
