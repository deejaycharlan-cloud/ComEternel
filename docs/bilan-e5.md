# E5 — Travail et packs

État au 13 septembre 2026 : implémenté et activé en local ; parcours principal vérifié dans le navigateur sur une base de recette isolée. Ce bilan ne vaut pas validation de mise en production.

## Livré

- Demandes reçues, à préciser, acceptées, reportées et refusées, avec motif et historique. Décision réservée au décideur, suppléant du projet ou administrateur disposant des droits projet. Une correction du brief accepté le repasse à préciser.
- Packs Essentiel, Standard et Étendu : aperçu conservé 30 minutes, choix des étapes, titres, consignes, livrables, échéances et propositions nominatives. Vidéo facultative. Dates initiales visibles et décalage proposé à partir du jour courant dans le fuseau du projet. Motif obligatoire pour conserver des dates passées.
- Un pack par occurrence ou campagne. Une réapplication identique, même concurrente, conserve l’application existante. Une réapplication différente demande de modifier les tâches existantes. Aperçus expirés ou périmés refusés.
- Tâches manuelles, liste personnelle ou équipe accessible, tableau par état, échéances dépassées, priorité normale/urgente et historique. Les consignes peuvent contenir des références textuelles ; les pièces Drive et dépôts restent à E6.
- Missions proposées puis acceptées ou refusées uniquement par leur destinataire. Un remplacement relance une proposition et remet la tâche à faire. Aucune acceptation par procuration ni droit accordé par un métier.
- Disponibilités déclarées par la personne, lecture limitée aux collègues ayant accès au projet, suppléant envisagé et charge du projet visible. Aucun classement des personnes, aucun suivi du temps. La disponibilité inconnue n’est pas présentée comme acquise ; les déclarations qui se chevauchent doivent être lues de façon restrictive.
- Dépendances au sein d’une occurrence/campagne, détection des boucles et blocage de l’avancement tant que les préalables ne sont pas terminés.
- Report de demande, annulation ou archivage : conservation des tâches et suspension des nouvelles actions de travail. Déplacement d’une date : échéances conservées et revue explicite avant avancement. Une tâche terminée ne valide ni ne publie un contenu.
- Alerte sur la préparation si le validateur manque, son accès est à revoir ou une indisponibilité couvre la période ; aucun transfert automatique de validation. Les remplacements et permissions de validation restent des décisions humaines.

## Vérification effectuée

- 8 tests unitaires réussis, dont les trois packs, le décalage des dates, la vidéo facultative et les dépendances.
- 4 scénarios d’intégration PostgreSQL réussis dans `cometernel_test`, couvrant E1/E3/E4 et E5. E5 couvre décisions/révisions, isolation, absence d’accès implicite, pack concurrent sans doublons, réapplication modifiée refusée, acceptation/refus/remplacement, dépendances, disponibilités, suspension, décalage, modification de brief, dates passées, création manuelle rejouée, aperçu périmé et expiré.
- Compilation de production et contrôle TypeScript réussis après les dernières modifications.
- Migration `0003_windy_juggernaut.sql` appliquée en local après sauvegarde PostgreSQL dans `.backups/pre-e5-*.dump`. Restauration de cette sauvegarde non testée à cette étape.
- Serveur local démarré sur `http://127.0.0.1:3100`.
- Navigateur : sur `cometernel_ui_test` via `http://localhost:3101`, connexion normale avec compte fictif, acceptation de demande, aperçu Essentiel, retrait d’une étape, proposition nominative, application du pack, blocage avant acceptation avec saisie conservée, acceptation de mission, passage En cours puis Terminée, lecture du tableau et enregistrement successif de deux disponibilités vérifiés. Après redémarrage, tâches et déclarations conservées. Le pack appliqué affiche son état et un accès aux tâches ; son formulaire ne propose plus une nouvelle application. Présentation de bureau inspectée visuellement. Les trois packs, refus, remplacement et dépendances sont couverts par les tests automatisés ; pas de recette complète sur téléphone physique à ce stade.

## Limites et suite

Pas d’envoi de notifications ou de relances rétroactives dans E5. Pas de worker de rappel activé : supervision et reprises générales restent à E11, automatismes avancés à E14. Les urgences signalent les échéances à revoir par un motif, sans déplacer automatiquement les autres missions. Les pièces et connexions Drive relèvent d’E6 ; validation et publication de contenus des étapes suivantes.

Les anciens espaces restent conservés jusqu’au nettoyage final, après revue et accord explicite. Aucun espace supprimé ni automatiquement rattaché : deux espaces présents après migration.

## Finalisation pour essai utilisateur

Correction des titres de pages, de l’état affiché après application d’un pack et de la réutilisation du formulaire de disponibilités. Scénarios PostgreSQL et compilation relancés avec succès après correction. Le serveur habituel reste sur le port 3100, le serveur fictif isolé sur 3101. Aucun contenu métier de la base habituelle n’a été modifié pour cette recette.

Le script `scripts/preview-e5.ts` prépare un compte et un projet fictifs dans la base locale réservée `cometernel_ui_test`, puis fournit un lien de connexion à usage unique et démarre le serveur de recette. Il ne modifie pas les permissions de l’application habituelle. `--serve-only` redémarre le serveur sans nouveau jeu de données. Les données fictives restent conservées pour la recette utilisateur.
