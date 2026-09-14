# Contrôle de sécurité — 14 septembre 2026

## Périmètre et résultats

- Revue de l’historique GitHub accessible : 25 commits, 329 objets fichier uniques. Recherche locale de formats de clés connus et comparaison avec les secrets disponibles, sans afficher leurs valeurs. Aucun secret de production détecté. Les URL PostgreSQL trouvées dans `.env.example` désignent uniquement les bases locales de développement et de test.
- Aucun fichier `.env.local`, clé privée, dossier `node_modules` ou compilation `.next` trouvé dans cet historique.
- Aucun secret disponible pour comparaison trouvé dans les fichiers JavaScript destinés au navigateur. Les identifiants publics OAuth et les URL de services ne sont pas des mots de passe.
- `npm audit` : zéro vulnérabilité connue signalée à la date du contrôle. Cela ne garantit pas l’absence de vulnérabilité inconnue.
- Supabase : les 38 tables publiques existantes ont RLS activé et aucune politique publique d’accès. Les deux nouvelles tables Drive sont créées avec RLS. L’application accède aux données côté serveur avec des contrôles d’association et de rôle.
- 12 tests unitaires et 8 scénarios d’intégration passent : sessions, invitations, refus, suppression différée, rôles, isolation entre associations, chiffrement et reprise des fichiers.

## Correctifs préparés

- Correction de la limitation des connexions : chaque visiteur Vercel utilise son adresse vérifiée au lieu d’un compteur partagé par tous les comptes. Les en-têtes non fiables restent ignorés en local. Référence : [en-têtes Vercel](https://vercel.com/docs/headers/request-headers).
- Ajout des en-têtes anti-encadrement, `nosniff`, politique de référent et restrictions navigateur ; suppression de l’en-tête identifiant Next.js.
- Vérification renouvelée des droits administrateur au moment de l’enregistrement de la connexion Drive.
- Effacement du jeton Drive stocké lors de la suppression différée du compte qui l’avait connecté.
- Reprise d’une session Drive expirée sans créer un doublon d’un fichier déjà reçu.

Les jetons OAuth et les URL de session Drive sont chiffrés côté serveur. n8n reçoit uniquement des identifiants de travaux et utilise un secret serveur ; il ne reçoit pas les jetons Google des associations. Le navigateur reçoit une URL temporaire limitée à l’envoi en cours, nécessaire au transfert direct ; cette URL doit être traitée comme confidentielle.

## Limites et suivi

Ce contrôle est une revue technique et des tests ciblés, pas un test d’intrusion exhaustif. L’accès serveur reste privilégié : la protection des secrets d’hébergement et les vérifications d’association dans le code sont indispensables. L’examen de l’historique est heuristique, sans certification d’absence de secret.

À la demande du propriétaire, les nouveaux mots de passe restent à 6 caractères minimum avec minuscule, majuscule, chiffre et caractère spécial. Ce seuil constitue un risque résiduel ; la limitation des tentatives ne remplace pas un mot de passe long. La double authentification des utilisateurs de ComÉternel n’a pas été ajoutée dans ce lot.

La politique CSP ajoutée protège notamment l’encadrement, les objets et les formulaires ; ce n’est pas une politique stricte des scripts avec nonce. Les contenus utilisateurs sont affichés via React, sans insertion HTML brute identifiée lors de la revue.

Restent à valider après déploiement : en-têtes effectifs, connexion OAuth Drive, gros fichiers réels, deux associations avec deux comptes Google et appareils mobiles. Aucune suppression de données de production ni rotation arbitraire de secrets n’a été effectuée pour ce contrôle.
