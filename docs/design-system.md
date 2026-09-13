# Design ComÉternel

Le thème accueille l’équipe dans un espace lumineux et chaleureux : fond ivoire très clair, vert profond pour les actions, ambre et corail pour les repères décoratifs. Le logo doré fourni reste seul dans l’en-tête. Les couleurs décoratives des cartes ne sont pas des statuts.

## Repères communs

Les variables de `src/app/globals.css` définissent les couleurs et surfaces :

| Usage | Couleur |
| --- | --- |
| Texte principal | `#183f39` |
| Texte secondaire | `#526a65` |
| Action principale | `#0c6358` |
| Fond général | `#f7faf6` |
| Cartes | `#ffffff` |
| Bordures | `#dce7df` |
| Accents décoratifs ambre et corail | `#efbf62`, `#e8987c` |

Les titres principaux gardent une typographie avec empattements, les outils et cartes utilisent la police système. Les cartes ont un rayon de 18 px, les boutons 11 px. L’accent doré accompagne le logo et les petites accroches ; il ne remplace pas les libellés de statut.

Les boutons principaux utilisent du texte blanc sur vert profond. Les actions secondaires ont une bordure verte sur fond blanc. Les champs restent blancs, avec bordure visible, libellé et focus. Les icônes accompagnent un nom lisible et ne remplacent pas le nom d’une action.

## Navigation

- Visiteur : logo, phrase d’accueil et connexion ; l’accueil présente l’équipe et ses usages.
- Membre : équipe active dans l’en-tête, menu de compte, puis navigation de travail unique.
- Responsable : réglages dans une section séparée de la navigation.
- Compte : menu natif `details/summary`, liens personnels et changement d’équipe. Le menu conserve une largeur maximale inférieure à l’écran et défile si nécessaire.
- Environnement local : indication discrète dans le pied de page, sans occuper les actions de travail.

La visibilité des liens dépend de la session et des droits dans les composants. Le CSS ne constitue pas un contrôle d’accès. Sur mobile, la navigation défile horizontalement dans sa propre zone et conserve des cibles tactiles de 44 px. Le menu compte garde son nom accessible, même lorsque seul l’avatar est visible.

## Accueils

L’accueil public utilise un fond vert clair et ambre, deux cartes illustrées en CSS et SVG et trois descriptions courtes. L’illustration est décorative et masquée aux lecteurs d’écran. Aucun service, image distante ou animation n’est nécessaire.

L’accueil connecté distingue le message d’accueil, les actions autorisées, trois indicateurs réels et les cartes d’engagements, projets, contenus et fichiers. Les couleurs douces des indicateurs créent des repères ; les chiffres et libellés portent l’information.

## Badges

Tous les badges utilisent `src/components/ui/badge.tsx` et les variables CSS `--badge-*` : taille de texte 12 px, hauteur minimale 26 px, rayon de 7 px, bordure discrète, retour à la ligne sur petit écran. Le composant n'est pas un bouton et ne prend pas le focus.

- `neutral` : métier, catégorie, service inactif.
- `info` : aperçu, préparation, invitation en attente.
- `success` : résultat réellement confirmé (ex. invitation acceptée).
- `warning` : information manquante, blocage ou accès retiré.
- `danger` : incident ou contrôle bloquant.

Le libellé explicite porte le sens. Aucune couleur seule ne signifie une validation. Les variantes ne changent ni forme ni taille selon la page. Le logo principal reste seul et son lien garde le nom accessible « ComÉternel — Accueil ».

## Lisibilité et écrans étroits

Les contrastes des couleurs de texte principales et des cinq badges ont été calculés avec la luminance relative : tous dépassent 4,5:1 sur leur fond défini. Le focus clavier reste marqué par une bordure dorée de 3 px. Les transitions se limitent aux couleurs des contrôles et sont supprimées si la réduction des mouvements est demandée.

Les listes, cartes et noms longs peuvent revenir à la ligne. Les colonnes se réduisent progressivement ; le calendrier conserve son défilement horizontal interne. Les tableaux du calendrier ne doivent pas provoquer le défilement horizontal de toute la page.

La vérification automatique de syntaxe CSS et de contraste ne remplace pas la vérification au navigateur de la navigation, des menus, des formulaires et du calendrier.
