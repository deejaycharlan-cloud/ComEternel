# Modules et périmètres

`app` contient les pages et actions serveur ; `db` les schémas et migrations ; `modules/identity`, `team`, `organizations`, `programme` et `work` portent les comptes, accès, espaces, programme et missions. `modules/production` contient les médias, collectes, droits, contenus et diffusion manuelle.

Les services vérifient les périmètres de projet et utilisent le verrou d’organisation partagé pour les mutations concurrentes. La validation éditoriale exige une permission explicite.

La table historique `jobs` prépare des traitements persistants mais aucun worker Drive, rappel ou notification automatique n’est livré. Voir [le bilan local](bilan-final-local.md) pour distinguer le fonctionnement testé des intégrations restantes.
