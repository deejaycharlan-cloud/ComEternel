# Bilan de la version locale — 13 septembre 2026

Le parcours local est livré pour test. Ce bilan ne constitue pas une validation complète du P0 en production. Il remplace les indications de statut des anciens bilans E1–E5, qui restent des traces historiques.

## Fonctions disponibles

| Domaine | Disponible localement |
| --- | --- |
| E1–E3 | Base persistante, identité, invitations locales, espaces, membres, droits et périmètres explicites |
| E4 | Événements, séries, campagnes, occurrences, fuseaux, report, annulation et archives |
| E5 | Briefs, packs prévisualisés, tâches, acceptation/refus de mission, remplacements, disponibilités |
| E6–E7 | Réception privée par fragments, reprise et reçu, intégrité SHA-256, quotas, signature de fichier, quarantaine, contrôle manuel, liens invités expirables/révocables, propositions à classer |
| E8–E9 | Versions de contenu, calendrier éditorial, droits, décisions de relecture, approbation explicite, invalidation après modification, paquet manuel, preuve de diffusion et retrait à traiter |
| E10 | Vue de suivi après événement et accès aux archives ; pas de clôture automatique |
| E11 | Vue de supervision locale, export des données accessibles, sauvegarde base + fichiers, exercice de restauration isolé |

Les erreurs de réception conservent les fragments. Le stockage local est privé ; l’adaptateur S3 est présent mais non testé contre un fournisseur réel. Aucun fichier n’a été annoncé comme transféré vers Drive. Aucun message externe ni aucune publication sociale n’a été envoyé.

## Contrôles effectués

- 8 tests unitaires et 5 scénarios d’intégration dans une base de test distincte : programme, tâches, permissions et chaîne fichiers/contenus.
- Réception fragmentée, reprise identique, conflit de fragment, réception incomplète, intégrité du téléchargement, isolement inter-organisations et quarantaine.
- Code de collecte, quota, révocation, proposition, classement ; aucun droit de validation implicite pour l’administrateur.
- Droits manquants, nouvelle version, commentaire après approbation, préparation concurrente sans doublon, preuve manuelle, droits retirés, retrait du contenu et projet annulé.
- Compilation et vérification TypeScript.
- Navigateur réel : accueil du pilote, liste éditoriale, approbation, préparation du paquet et dépôt d’une image synthétique par un lien invité avec affichage du reçu.
- Restauration d’une copie du pilote dans une nouvelle base : deux fichiers intègres, téléchargement autorisé et refus d’un non-membre. La base principale n’a pas été écrasée.

La boîte locale a servi aux connexions. Une sauvegarde de la base principale a été prise avant les nouvelles migrations. Les anciens espaces sont conservés. La vue mobile complète, les gros fichiers et la charge concurrente réelle n’ont pas été validés dans un navigateur.

## Reste à livrer ou à valider avant production

- Google Drive est reporté par décision utilisateur. Il reste à implémenter et tester la connexion de l’association, les dossiers, le transfert persistant, les reprises et la vérification des copies. Ce n’est pas seulement une clé à renseigner.
- Stockage distant réel, réception directe éventuelle, antivirus, supervision de processus et politique de conservation/quotas physiques. Les fragments et originaux peuvent consommer davantage que le volume déclaré.
- Emails externes et connexion Google réelle ; hébergement, HTTPS, secrets de production, sauvegardes chiffrées et plan de reprise sur l’hébergement cible.
- Automatisations persistantes de rappels, notifications, suivi des retraits sur les canaux et phases après événement. Le suivi actuel exige une intervention humaine.
- Une collecte cible un seul projet/une seule occurrence. Le classement vers un nouvel événement passe par sa création préalable. Les sélecteurs invités de plusieurs événements ne sont pas livrés.
- Recette avec les responsables et bénévoles réels, mobile, accessibilité exhaustive, volumétrie et critères complets du cahier des charges.
- Google Calendar, n8n, IA et publication sociale automatique restent des extensions non activées.

Aucun ancien espace ne doit être supprimé avant validation du remplacement, sauvegarde vérifiée et accord sur les espaces concernés.

## Mise à jour : interface et préparation Drive/n8n

L’utilisateur a ensuite demandé d’engager la connexion Drive/n8n. L’ancien report est donc remplacé par une configuration en attente du compte Drive, du dossier cible et de l’adresse n8n.

La navigation publique ne montre plus les outils métier. Après connexion, elle dépend de l’appartenance à une équipe et des accès aux projets. Les réglages sont présentés aux administrateurs, et le menu compte réunit la connexion et le changement d’équipe. Le tableau de bord respecte l’équipe sélectionnée ; les actions de création suivent les droits disponibles. Le thème est devenu vert, ambre et corail, avec des variantes mobile.

Le serveur comprend désormais une file de transfert manuelle, un accès n8n limité à une organisation, la réservation d’un fichier Drive et la vérification des métadonnées retournées. Les migrations 0006 et 0007 et les tests de reprise, de conflit, de droits et d’intégrité ont réussi localement. Le workflow importable et les instructions sont dans `integrations/n8n` et `integration-drive-n8n.md`. Le premier transfert de test est limité à 5 Mo ; les fichiers plus gros restent stockés localement.

La connexion à une vraie instance n8n et à Google Drive n’a pas été effectuée. Le contrôle visuel du nouveau thème est resté bloqué par une vérification de sécurité indisponible du navigateur ; compilation, tests et vérification des contrastes ne le remplacent pas.
