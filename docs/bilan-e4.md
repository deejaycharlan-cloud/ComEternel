# Livraison E4 — Programme local

Demande utilisateur : « e4 », après acceptation d'E3 locale. L'implémentation n'engage pas E5 ni une publication.

## Livré

- Projets persistants : événement ou campagne ; type/thème personnalisable, ministère, lieu, informations pratiques, responsable, validateur autorisé, remplaçant et niveau de communication.
- Demande de communication liée au projet : objectif, public, message, ressources, date utile et décideur. État initial « reçue ». Le traitement de la demande et les packs restent E5.
- Événements uniques ou séries hebdomadaires/mensuelles (1 à 104 occurrences). Dates 2000–2100, période initiale de 366 jours maximum. Le nombre borné est explicite dans le formulaire ; aucune série infinie silencieusement tronquée.
- Journées entières distinctes des instants horaires. Fuseau conservé, heures ambiguës/inexistantes refusées. La récurrence maintient l'heure locale ; fin de mois ajustée sans dérive cumulative.
- Création transactionnelle avec clé de rejeu et empreinte des valeurs : un double clic crée un seul projet, brief et jeu d'occurrences. Aucun enregistrement métier n'est effectué pendant la prévisualisation.
- Fiche projet, corrections du brief, report avec nouvelles dates/heures, annulation d'une occurrence ou du projet, archivage sans effacement. Identités des occurrences et dates initiales conservées.
- Report de série : toutes les occurrences sans exception sont recalculées, y compris celles dont la date est passée ; exceptions reportées ou annulées individuellement conservées. Annulation globale : toutes les occurrences, y compris les exceptions, sont annulées. La portée est explicitée avant confirmation.
- Révision du projet contrôlée côté serveur : une modification concurrente rend la soumission périmée et demande d'actualiser. Journal de changements et impacts à examiner ; aucune tâche clôturée ni publication corrigée automatiquement.
- Calendrier annuel, mensuel, hebdomadaire et liste sur 12 mois, avec campagnes comme périodes sans faux événement. Projets archivés exclus du calendrier, annulations toujours identifiées. Les horaires sont convertis au fuseau de l'association ; les journées entières conservent leurs dates.
- Dates liturgiques saisies avec tradition, calendrier local et source obligatoires. Superposition facultative, filtre par tradition, vérification humaine nominative/date, correction avec retrait de l'ancienne vérification sauf confirmation explicite d'une nouvelle. Aucune fête ou pratique supposée.
- Projets privés : appartenance active, permission globale et droit nominatif au projet. La création ouvre explicitement lecture/édition à son auteur. L'administrateur peut administrer les portées, mais n'obtient ni lecture générale des projets ni validation de contenus implicite. L'interface d'accès se trouve sur la fiche d'un projet accessible.
- Les contrôles de démonstration sont masqués sur les rubriques devenues réelles. L'accueil E2 reste une prévisualisation de métiers et renvoie aux projets/calendrier réels.

## Preuves exécutées

- 6 tests unitaires réussis : configuration/validation E1, récurrence à travers le changement d'heure, heures inexistantes ou doubles refusées, dates impossibles, durée invalide, journée entière, fin de mois sans dérive, conversion du fuseau du calendrier, fin horaire exclusive et périodes.
- 3 scénarios d'intégration PostgreSQL réussis : régression E1, accès/session E3 et scénario E4.
- Scénario E4 : double création concurrente sans doublon ; données différentes sur même clé refusées ; campagne sans occurrence ; IDs conservés après report individuel, changement d'heure et report de série ; occurrence annulée préservée ; ancienne révision rejetée ; écriture invalide sans projet partiel ; visibilité de deux organisations et de deux projets distincts ; édition refusée au lecteur ; personne d'une autre organisation refusée ; source liturgique absente refusée ; correction retirant la vérification ; annulation globale puis archive conservant événements et brief reçu ; départ supprimant l'accès.
- Build Next.js et vérification TypeScript réussis.
- Migration additive 0002 appliquée à la base locale après sauvegarde PostgreSQL dans `.backups/`. Aucun ancien espace, compte ou accès supprimé. La sauvegarde n'a pas fait l'objet d'un exercice de restauration ; cet exercice reste E11.
- Aucune donnée de démonstration ajoutée à la base applicative. Les tests créent/nettoient leurs données dans la base dédiée `_test`.

## À vérifier et limites

Le parcours utilisateur en navigateur, les contrôles clavier/lecteur d'écran et le téléphone restent à vérifier. La grille mensuelle défile horizontalement sur petit écran ; la vue Liste permet une lecture étroite sans grille.

Les dates liturgiques réelles attendent les choix du pilote et la validation d'un responsable. Aucun calendrier externe n'a été importé. Google Calendar, rappels, tâches, fichiers, packs et publications restent aux étapes prévues. L'authentification conserve le mode email local E3 et ses limites.

La gestion des personnes d'un projet est définie à la création ; les changements d'affectation et remplacements opérationnels seront traités avec les missions E5. L'archivage E4 conserve les données ; le suivi après événement complet reste E10.

État : E4 locale codée, contrôles techniques réussis ; revue visuelle et validation utilisateur en attente. T04 automatisé couvert sur les cas ci-dessus, T16 couvert sur la provenance et le circuit de vérification, sans validation religieuse réelle.

Après redémarrage, le serveur compilé signale Ready sur 127.0.0.1:3100. L'essai d'ouverture de `/projets` par l'outil navigateur a été refusé : vérification de sa politique de sécurité indisponible. Aucun contrôle visuel n'a donc été réalisé et aucun contournement tenté.
