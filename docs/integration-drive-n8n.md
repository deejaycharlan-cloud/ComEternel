# Connecter le premier test Google Drive et n8n

État du 13 septembre 2026 : le protocole côté application et un workflow manuel sont préparés localement. Le compte Drive, le dossier de test et l’instance n8n restent à choisir. Aucun fichier n’a été transmis à Google, aucun workflow n’a été installé ou activé à distance et aucune adresse publique n’a été créée.

Le premier test porte sur **un fichier contrôlé de 5 Mo maximum**, demandé explicitement par un administrateur. Il permet de vérifier l’ensemble du trajet : ComÉternel → n8n → Drive → confirmation dans ComÉternel. Il ne publie aucun contenu sur les réseaux sociaux.

## Fichiers livrés

- `integrations/n8n/cometernel-drive-test.json` : workflow importable, inactif, sans credential ni destinataire prérempli.
- `integrations/n8n/cometernel-drive-test.workflow.ts.template` : source n8n-as-code à renommer seulement dans le dossier de workflows de l’environnement sélectionné. L’extension évite de l’inclure dans la compilation de l’application.
- `integrations/n8n/contract.schema.json` : contrat des échanges.
- `integrations/n8n/workflow.test.mjs` : vérifications locales des décisions, reprises et connexions.
- `integrations/n8n/build-workflow.mjs` : génération hors ligne des deux formats ; ne contacte aucun service.

Les deux formats ont passé le validateur de schéma n8n-as-code, avec zéro erreur et zéro avertissement. Les huit tests locaux des branches ont réussi. Ces vérifications ne remplacent pas une exécution sur l’instance choisie : les credentials, la version n8n, le transport binaire et les réponses réelles de Google restent à vérifier.

## Connexions à fournir

1. Le lien de l’instance n8n prévue pour l’association.
2. Le compte Google de l’association qui autorisera Drive.
3. Le lien d’un dossier Drive réservé aux tests et ses droits d’accès prévus.
4. L’adresse de ComÉternel accessible **depuis n8n**.

Un n8n hébergé ailleurs ne peut pas joindre le `localhost` de cet ordinateur. Pour un n8n dans Docker sur ce Mac, l’adresse `host.docker.internal` peut joindre l’application locale si son écoute réseau le permet. Pour un n8n distant, utiliser l’environnement privé de test prévu. L’ouverture d’un tunnel ou la mise en ligne de l’application constituent une configuration distincte ; aucun tunnel n’est créé par ce workflow.

Ne transmettre ni mot de passe ni clé par messagerie. Les connexions Google se font avec l’écran OAuth ; les jetons de service se placent dans les secrets du serveur et les credentials n8n.

## Configuration de l’application

Définir dans les secrets du serveur :

| Variable | Valeur attendue |
| --- | --- |
| `N8N_ORGANIZATION_ID` | Identifiant de l’organisation autorisée pour ce test |
| `GOOGLE_DRIVE_FOLDER_ID` | Identifiant du dossier Drive choisi |
| `N8N_SERVICE_TOKEN` | Jeton aléatoire dédié, d’au moins 32 caractères |

Les trois champs sont nécessaires. Le jeton donne accès aux seuls transferts de cette organisation vers ce dossier ; il ne remplace pas la connexion personnelle d’un membre. Ne pas réutiliser le secret d’authentification de l’application ou un jeton n8n administrateur. Redémarrer l’application après ajout des secrets.

La source doit être un média contrôlé, classé dans un projet actif, sans proposition invitée en attente ou refusée et sans retrait de droits. La personne qui demande le transfert doit rester administratrice, disposer des droits du projet et avoir une adresse vérifiée. Ces conditions sont recontrôlées avant de réclamer le transfert et de télécharger le fichier.

## Configuration n8n

1. Sélectionner l’environnement n8n choisi et vérifier sa version. Le brouillon a été validé avec les schémas `HTTP Request 4.5`, `If 2.3`, `Edit Fields 3.5`, `Manual Trigger 1`, `Stop and Error 1` et `NoOp 1`.
2. Importer le JSON dans un nouveau workflow de test. Laisser le workflow inactif. Pour un environnement géré par n8n-as-code, résoudre d’abord l’environnement et son dossier de workflows, puis y installer la source TypeScript, valider, pousser et relire les connexions. Ne pas écraser un workflow existant.
3. Créer un credential **Header Auth** nommé par exemple « ComÉternel — test Drive » : nom d’en-tête `Authorization`, valeur `Bearer ` suivie du jeton de service. Sélectionner ce credential sur les nœuds qui parlent à ComÉternel.
4. Créer ou sélectionner un credential **Google Drive OAuth2**, connecté au compte choisi. Sélectionner le même credential sur tous les nœuds Google. Si une application OAuth propre est nécessaire, reprendre l’URL de redirection affichée par n8n, activer l’API Drive et autoriser le compte de test. [Documentation n8n Google OAuth2](https://docs.n8n.io/integrations/builtin/credentials/google/oauth-single-service/).
5. Vérifier que le credential accède au dossier prévu. Les droits hérités du dossier s’appliquent aux fichiers ; choisir un dossier privé adapté aux participants du test. Aucune permission « public » ou « toute personne disposant du lien » n’est créée par le workflow.
6. Dans « Configuration du test », renseigner `appBaseUrl` avec l’origine exacte, sans chemin ni slash final. Passer `testEnabled` à `true` seulement lorsque le dossier et les credentials sont prêts.
7. Conserver le lancement manuel, le délai maximal de dix minutes et le fuseau Martinique. Les détails des exécutions ne sont pas enregistrés automatiquement dans ce brouillon ; inspecter la première exécution dans l’éditeur pendant le test sans exporter de données privées.

Le MCP natif n8n-as-code était désactivé et non configuré pendant la préparation. Le démarrage du CLI hors ligne a échoué parce que le paquet n’était pas en cache. La préparation s’est donc faite avec les schémas et le validateur disponibles, sans inventer d’environnement, de dossier synchronisé ou d’identifiant de workflow distant.

## Contrat application → n8n → Drive → application

Toutes les routes sont sous l’origine fixe configurée. Chaque appel à l’application porte le credential `Authorization: Bearer …`. Le jeton n’apparaît ni dans les URL ni dans les corps JSON. Les routes ne lisent pas la session du navigateur et ne donnent pas accès aux autres médias.

| Route | Corps ou en-tête | Effet |
| --- | --- | --- |
| `POST /api/integrations/n8n/jobs/claim` | `{ "requestId": "identite-de-lexecution-n8n" }` | Réserve au plus un transfert ; réponse `{ "job": null }` si rien n’est en attente |
| `POST /api/integrations/n8n/jobs/:id/reserve` | `{ "leaseId": "…", "driveFileId": "…" }` | Conserve durablement l’identifiant Drive avant la première création |
| `GET /api/integrations/n8n/jobs/:id/file` | En-tête `X-Cometernel-Lease: …` | Lit uniquement l’original lié au transfert, avec contrôle SHA-256 |
| `POST /api/integrations/n8n/jobs/:id/result` | `{ "leaseId": "…", "status": "succeeded", "driveFile": {…} }` | Vérifie et enregistre le reçu |
| Même route de résultat | `{ "leaseId": "…", "status": "failed", "errorCode": "transfer_failed" }` | Rend l’échec visible sans effacer l’original |

Le `job` contient `id`, `leaseId`, `mediaId`, `name`, `mime`, `size`, `sha256`, `folderId` et `driveFileId` nullable. Le verrou vaut vingt minutes ; le workflow s’arrête au bout de dix minutes. Le même `requestId` ne peut pas réclamer deux transferts. Les reprises utilisent le même identifiant Drive enregistré par `reserve`.

Le reçu `driveFile` vient d’une **relecture Google**, avec `id`, `mimeType`, `size` sous forme de chaîne, `sha256Checksum`, `parents`, `trashed: false` et `appProperties.cometernelJob`. Une réponse 200 d’un téléchargement ou d’un upload ne suffit pas à annoncer la réussite. Si Google ne fournit pas l’empreinte attendue, le résultat reste en échec.

Les états de l’application sont `queued`, `running`, `succeeded`, `failed` et `suspended`. Une erreur de connexion n’entraîne pas la suppression d’un fichier. Une suspension de la source exige une vérification humaine ; elle n’est pas contournée par le workflow.

## Reprises sans création de doublon

Le workflow demande d’abord un identifiant à Google, puis l’enregistre dans ComÉternel avant toute création. Google permet de réutiliser cet identifiant en cas de réponse incertaine sans créer de doublon. [Identifiants préalloués Google Drive](https://developers.google.com/workspace/drive/api/guides/manage-uploads#use_a_pre-generated_id_to_upload_files).

Le workflow lit ensuite le fichier correspondant :

- S’il existe avec le bon dossier, le bon transfert, la bonne taille et le bon SHA-256, il envoie le reçu sans réécrire les octets.
- S’il est absent, il crée ses métadonnées avec cet identifiant. Un conflit de création entraîne une relecture.
- S’il est encore vide, appartient au transfert et se trouve dans le bon dossier, il reçoit l’original.
- S’il contient déjà des octets différents ou a été déplacé, le test s’arrête. Le workflow ne remplace pas ce fichier.

Le contenu transite dans le champ binaire n8n `data`, directement du téléchargement à l’upload ; aucun encodage base64 n’est enregistré dans le JSON du workflow. Le test emploie l’upload simple, limité ici à 5 Mo. [Création des métadonnées](https://developers.google.com/workspace/drive/api/reference/rest/v3/files/create), [mise à jour du contenu](https://developers.google.com/workspace/drive/api/reference/rest/v3/files/update).

Le SHA-256 retourné par Google décrit le contenu stocké lorsqu’il est disponible ; il ne s’applique pas de la même manière aux documents Google natifs. Le test conserve donc les fichiers binaires originaux et ne les convertit pas en documents Google. [Métadonnées et empreintes Drive](https://developers.google.com/workspace/drive/api/reference/rest/v3/files).

## Test à exécuter une fois les cibles connectées

1. Choisir une petite image fictive, sans personne identifiable, dans un projet de test. La déposer puis la contrôler dans ComÉternel.
2. Avec l’administrateur prévu, demander explicitement le transfert de cette image. Vérifier qu’un seul transfert est en attente.
3. Cliquer une fois sur « Lancer un seul test » dans n8n.
4. Vérifier que Drive contient un seul fichier dans le dossier exact, et que ComÉternel affiche la confirmation avec le même identifiant, la même taille et la même empreinte.
5. Relancer n8n sans autre demande : le workflow doit se terminer avec « Aucun transfert en attente ».
6. Tester une interruption avant le retour vers ComÉternel sur un deuxième fichier fictif. Reprendre le même transfert après expiration du verrou ou selon l’action de reprise de l’application ; vérifier que l’identifiant Drive reste identique.
7. Tester un mauvais dossier ou une empreinte incorrecte avec les fixtures locales : aucun reçu de réussite ne doit être accepté. Ne pas altérer un fichier réel pour ce scénario.

Le premier test réel n’a pas été exécuté : son résultat doit être consigné après connexion, sans assimiler la validation du schéma à une réussite Google Drive.

## Limites de ce premier workflow

- Un seul dossier configuré pour une organisation et un seul transfert demandé à la fois par lancement manuel.
- Pas de surveillance planifiée, de transfert automatique de dépôts invités, de notification externe, de génération automatique des dossiers de campagne ou de suppression automatique.
- Le prototype de transfert simple est limité à 5 Mo ; le transfert Drive de gros médias avec progression et reprise par morceaux reste un lot distinct.
- La confirmation repose sur le worker n8n authentifié qui relit Google ; l’application compare le reçu à ses données, elle ne possède pas de credential OAuth Google pour effectuer une seconde relecture indépendante.
- La revue manuelle des médias ne remplace pas un antivirus. Ce test n’ajoute pas de moteur antivirus.
- Pour un service régulier, extraire la copie Drive et le suivi d’incidents en sous-workflows typés une fois les identifiants de l’instance connus, puis tester leur fonctionnement avant toute planification.

## Vérifications locales reproductibles

Depuis le dossier de l’application :

```sh
node --test integrations/n8n/workflow.test.mjs
```

Pour régénérer les deux formats après une modification du générateur, puis les revalider :

```sh
node integrations/n8n/build-workflow.mjs
node --test integrations/n8n/workflow.test.mjs
```

Une modification nécessite aussi la revalidation du JSON et de la source TypeScript avec l’outil n8n-as-code avant import. Les tests locaux vérifient les décisions et le câblage ; seul un test connecté vérifiera le moteur n8n, les credentials et la copie réelle.
