# Essayer la version locale

État vérifié le 13 septembre 2026. Google Drive sera configuré plus tard, à la demande de l’utilisateur.

## Choisir le bon espace

- `http://localhost:3101` : pilote séparé, avec deux événements et une campagne fictifs. Utiliser cette adresse pour les essais.
- `http://127.0.0.1:3100` : application principale et données conservées.

Les cookies de connexion sont liés au nom d’hôte. Conserver l’adresse choisie pendant le parcours. Les messages de connexion et invitations de test arrivent dans la boîte locale `http://127.0.0.1:58025`, sans envoi à un destinataire externe.

## Parcours complet

1. Dans **Mon compte**, vérifier l’identité ; dans **Mon espace**, vérifier le fuseau Martinique et les membres. Un accès administrateur ne donne pas automatiquement le droit de valider les contenus : attribuer les droits globaux et ceux du projet explicitement.
2. Dans **Projets**, créer un événement, une série ou une campagne, compléter le brief et traiter sa demande. Vérifier les dates dans **Calendrier**.
3. Dans le suivi du projet, prévisualiser un pack avant de l’appliquer. Dans **Mes tâches**, accepter une mission, changer son avancement et renseigner ses disponibilités. Une proposition de mission n’est pas une acceptation.
4. Dans **Médias**, importer une image de test. Suspendre et reprendre avec le même fichier si nécessaire. Après création d’un projet dans un nouvel onglet, utiliser **Actualiser les projets**, puis choisir le nouveau projet sans perdre les fichiers sélectionnés.
5. Dans **Collectes**, créer un lien temporaire pour un projet/une occurrence. Copier le lien dès sa création : son secret n’est pas conservé en clair. Tester le dépôt invité ; une proposition d’autre événement reste en attente de classement. Pour créer cet événement, le créer d’abord dans Projets puis classer la proposition.
6. Ouvrir le fichier reçu, effectuer le contrôle manuel puis documenter ses droits. Une réception ne signifie ni analyse antivirus ni transfert Drive. Un fichier en quarantaine ne peut pas être téléchargé par la route habituelle.
7. Dans **Contenus**, créer un brouillon, choisir les fichiers contrôlés, renseigner les droits et le canal, puis soumettre. Un validateur autorisé demande des corrections ou approuve cette version précise. Toute nouvelle version exige une nouvelle approbation.
8. Préparer le paquet manuel et télécharger son texte et ses références. Pour le pilote, ne rien publier sur un réseau réel. La déclaration de diffusion demande une preuve et une date avec fuseau, par exemple `2026-09-13T10:30:00-04:00` ; elle doit correspondre à une diffusion réellement effectuée.
9. Tester le retrait sur un contenu fictif : la préparation est bloquée et les copies déjà diffusées doivent être retirées manuellement. Réviser les droits bloque également une préparation dont l’approbation n’est plus valable.
10. Consulter **Suivi après événement** depuis le projet et **Suivi et services** depuis Mon espace. L’archivage ne ferme pas automatiquement les missions. L’export administratif ne contient que les projets accessibles ; il ne constitue pas une sauvegarde des fichiers.

## Limites à connaître

Cette version est utilisable pour une recette locale. La connexion Drive, son classement automatique et ses transferts ne sont pas livrés ; les fichiers restent dans le stockage privé local. Les emails externes, l’analyse antivirus et la mise en ligne restent à préparer et à tester. Le pilote ne valide pas une utilisation réelle avec plusieurs bénévoles ou de gros volumes.

Les anciens espaces et tous les originaux restent conservés. Aucun nettoyage automatique n’est activé. Les étapes et intégrations restantes sont détaillées dans `bilan-final-local.md`.
