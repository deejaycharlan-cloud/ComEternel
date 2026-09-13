# Livraison E2 — 13 septembre 2026

## Autorisation et résultat

Après E1, l'utilisateur a répondu « parfait ». La prochaine étape E2 a été annoncée, puis l'utilisateur a répondu « ok ». E1 est donc accepté côté utilisateur et le développement des parcours E2 est engagé sur cet accord. Cet accord ne transforme pas les contrôles visuels non exécutés d'E1 en tests réussis.

Navigation : Accueil, Projets, Calendrier, Médias, Équipe ; accès directs à Mes tâches, Contenus et validations, Mon espace. Sous-parcours : préparation d'un brief, préparation d'un import. La création d'espace E1 est conservée dans Mon espace et utilise toujours PostgreSQL ; sa revalidation cible maintenant cette page.

Accueil : choix entre les huit métiers du cahier des charges. Chaque vue change l'intention, la contribution proposée et le lien prioritaire. Ce sélecteur est une prévisualisation de présentation, sans identité, permission ou affectation réelle.

Exemples : désactivés par défaut, activables explicitement. Trois projets fictifs, dates fixes de septembre 2026, deux personnes fictives et exemples de mission/contenu/média sont signalés comme tels. Aucun exemple n'est écrit en base. Le choix d'exemples et du métier reste en mémoire lors des navigations ; il revient à sa valeur initiale au rechargement complet.

Formulaire de brief : nom, type, public et message, champs obligatoires, limites de longueur, aperçu modifiable annoncé au lecteur d'écran. Le texte indique avant saisie qu'aucun projet n'est créé et que quitter la page perd la saisie. Il n'y a ni faux enregistrement ni envoi de fichier.

États : écrans sans données, exemples, filtre événement/campagne, page absente, chargement et erreur avec réessai. Base indisponible : état E1 conservé dans Mon espace.

## Contrôles réellement effectués

- `npm test` : 2 tests existants réussis.
- `npm run test:integration` : scénario PostgreSQL existant réussi ; aucune migration nouvelle requise.
- `npm run build` : toutes les routes compilées et pages statiques générées.
- `npm run typecheck` : réussi.
- Serveur compilé E2 redémarré sur le port local 3100.
- Vérification du code : labels, éléments natifs clavier, lien d'évitement, indication de page active, zones de statut, styles de focus, navigation à cinq colonnes sur petit écran, contrôle des exemples sans écriture métier.

## Vérifications restantes

Le navigateur a de nouveau refusé l'ouverture locale : la vérification de sa politique de sécurité était indisponible. Aucun contrôle navigateur contournant ce refus n'a été utilisé. Aucune capture ni validation visuelle, mobile, clavier ou lecteur d'écran n'est revendiquée. T14 reste partiel (préparation dans le code).

À essayer à http://127.0.0.1:3100 :
1. Parcourir les cinq rubriques et revenir à l'accueil.
2. Activer les exemples fictifs ; changer de métier et observer la contribution proposée.
3. Filtrer les projets par événement et campagne.
4. Préparer un brief, prévisualiser puis modifier un champ : l'aperçu doit repasser en attente de prévisualisation.
5. Ouvrir Mon espace et retrouver les données E1 réellement enregistrées.
6. Tester au clavier (Tab, Entrée, Espace), en fenêtre étroite et au zoom 200 % ; confirmer la lisibilité et l'absence de débordement.

État : code E2 livré, compilation et régression technique réussies ; revue visuelle et validation utilisateur en attente. E3 non engagé. Les données métier persistantes, invitations, dépôt et services restent aux étapes prévues.
