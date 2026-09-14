# Classement Drive par association

Le workflow actuel reçoit un signal authentifié de ComÉternel et reprend les travaux en attente chaque minute. Il appelle uniquement les routes `/api/integrations/n8n/direct-drive/claim` et `/classify` de l’application.

La connexion HTTP Header Auth doit contenir `Authorization: Bearer <N8N_SERVICE_TOKEN>` dans le coffre n8n. Ne pas inscrire sa valeur dans le fichier versionné. Le workflow ne contient aucun credential Google ; ComÉternel choisit la connexion de chaque association côté serveur.

Le modèle `classement-drive.workflow.ts.template` utilise n8n-as-code. Les identifiants de workflow et de credential référencent l’instance de ce projet ; les adapter pour une autre installation. L’extension `.template` exclut cet outil de la compilation Next.js.

L’ancien scénario de transfert binaire et ses fichiers de test sont retirés de la version courante. Ils restent récupérables dans l’historique Git. Les fichiers utilisateurs déjà transférés sont conservés.

Voir [la configuration et la recette](../../docs/drive-direct.md). Tester un signal authentifié et contrôler le résultat dans Drive ; une réponse HTTP 202 confirme uniquement l’acceptation du signal.
