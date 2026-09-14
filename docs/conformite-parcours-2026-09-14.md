# Vérification du parcours ComÉternel — 14 septembre 2026

Objectif : centraliser consignes, responsabilités, échéances, fichiers et décisions pour réduire les échanges dispersés. Les demandes récentes du client priment sur les anciennes listes du cahier des charges.

| Besoin | Code et comportement vérifiés | État |
| --- | --- | --- |
| Chaque association choisit ses événements | Types libres dans le formulaire, suggestions tirées des projets accessibles de l’association. Suppression de la liste universelle prédéfinie. Les données historiques sont conservées. | Corrigé |
| Préparer avant l’événement | Brief, décision, packs de tâches et dates relatives ; flyers, slides et teaser facultatif. | Existant et enrichi |
| Affecter selon les métiers | Suggestion parmi les membres autorisés, selon métier, indisponibilités et charge ouverte du projet. Le responsable confirme ; le membre accepte sa mission. Pas d’affectation forcée. | Corrigé |
| Administrer tous les projets de son association | Suppression d’une exigence redondante de permission de projet pour les administrateurs dans le service des tâches. La validation de contenu conserve ses droits spécifiques. | Corrigé |
| Captation pendant/après | Rushs ouverts à l’heure de début ou au début du jour local pour une journée entière. Contrôle serveur, y compris invité et ancien import. Choix d’une occurrence obligatoire. Les événements passés restent ouverts tant qu’actifs. | Corrigé |
| Préparer un lien invité en avance | Création possible avant l’événement ; le lien affiche la date et attend l’ouverture. Aucune connexion Google/ComÉternel exigée pour l’invité. | Corrigé |
| Livrables avant ET après | Import de créations/livrables indépendant de l’ouverture des rushs. Teasers/flyers avant, récapitulatifs/interviews après. | Vérifié |
| Utiliser les fichiers Drive dans les créations | Les livrables dont la réception directe est vérifiée deviennent sélectionnables dans un brouillon. Rushs, fichiers incomplets, quarantaine et propositions non acceptées sont exclus. Les droits et la validation restent obligatoires pour diffuser. | Corrigé |
| Savoir quoi faire sans redemander | Consignes, échéance, responsable, suppléant, acceptation, état, dépendances et historique par tâche. Liens directs vers livrables et calendrier éditorial du projet. | Existant et relié |
| Planifier les publications | Contenus datés, versions, commentaires de validation et calendrier éditorial. Une tâche terminée ne publie rien automatiquement. | Existant |
| Drive par association | Connexion et destination propres à l’association ; transfert direct et classement n8n. Aucun changement de credential partagé dans ce lot. | Tests simulés repassés |

## Tests

- Construction de production et vérification TypeScript : réussies.
- 15 tests unitaires : réussis, dont limites horaires des rushs et suggestions métier/absence/charge.
- 9 suites d’intégration : réussies sur PostgreSQL local dédié, avec boîte mail locale et Google simulé.
- Parcours couverts : accès, révocation, isolation entre associations, tâches sans permission redondante pour l’admin, acceptation/refus, reports, droits, versions, publication manuelle, imports, réception Drive, classement sans doublon et invités.
- Premier lancement des intégrations impossible car Docker était arrêté ; services locaux relancés puis neuf suites réussies.
- Aucun email réel, import massif réel ou publication sur un réseau social effectué dans ce lot. Le test Drive déclare un fichier de 1 Go mais simule Google : il ne mesure pas un transfert réel de 1 Go.

## Écarts restant à traiter pour le périmètre complet

- Les tâches et contenus partagent le projet et sont reliés par navigation ; une relation explicite tâche → version livrée n’est pas encore enregistrée.
- Pas de fil de discussion avec mentions par tâche. Les consignes et motifs d’avancement sont centralisés, les commentaires détaillés existent pour les validations de contenus.
- Les rappels groupés d’échéance et emails automatiques d’affectation ne sont pas activés par ce lot. Ne pas les confondre avec les emails d’invitation à l’association.
- Publication sociale manuelle avec preuve ; aucune publication automatique aux réseaux sociaux.
- Suggestions de charge limitées au projet visible, sans calcul global interassociations.
- Évaluation sur de vrais événements avec des bénévoles et essais iPhone/Android de gros fichiers encore nécessaires ; aucune réduction mesurée des échanges WhatsApp n’est revendiquée.
