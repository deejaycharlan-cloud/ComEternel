# Essayer E4

1. Se connecter à ComÉternel et ouvrir **Projets**.
2. Choisir l'association, puis **Nouveau projet**. Un administrateur ou un membre autorisé à modifier les projets peut créer.
3. Choisir événement ou campagne, renseigner le type, le début, la fin et le fuseau. Pour une série, choisir la fréquence et le nombre d'occurrences. Les noms de types proposés sont modifiables librement.
4. Renseigner la demande. **Prévisualiser les dates** n'enregistre rien ; **Enregistrer le projet** crée la fiche et la demande reçue.
5. Ouvrir la fiche. Dans une occurrence, **Modifier cette occurrence uniquement** permet de la reporter ou de l'annuler avec un motif.
6. Dans **Gérer le projet**, reporter la série : les exceptions existantes restent en place. Vérifier les dates dans **Calendrier**.
7. Depuis la fiche, un administrateur peut définir les accès nominatifs d'un autre membre. La permission globale correspondante dans **Équipe** doit également être présente ; un métier seul ne suffit pas. Après cinq minutes de connexion, se reconnecter avant de modifier les accès.
8. Essayer les vues année/mois/semaine/liste. Les campagnes sont des périodes, les annulations restent marquées, les archives sont dans le filtre Archives de Projets.
9. Dans **Sources du calendrier liturgique**, un administrateur peut saisir une référence. Tradition, calendrier local et source sont obligatoires. Cocher la vérification seulement après un contrôle humain réel.

Ne pas utiliser de dates, personnes ou vérifications inventées comme données réelles. Le mode email local reste réservé aux essais.

## Mise à jour locale

Les dépendances sont verrouillées et la migration est additive :

```sh
npm ci
npm run db:migrate
npm test
npm run test:integration
npm run build
npm start -- --port 3100
```

Sauvegarder les données utiles avant migration. Les sessions/comptes E3 restent conservés. La création d'un nouveau projet ne transfère aucun fichier et n'engage aucune mission.

Les choix de calcul des dates utilisent Temporal : https://tc39.es/proposal-temporal/docs/timezone.html et https://tc39.es/proposal-temporal/docs/plaindatetime.html. Le polyfill installé est figé dans le verrou npm.
