export function navigationSection(path:string) {
 if(path==='/')return '/';
 if(path.startsWith('/contenus/'))return '/livrables';
 if(path.startsWith('/collectes'))return '/medias';
 if(path.startsWith('/packs/'))return '/taches';
 if(path==='/exploitation')return '/reglages';
 return '/'+path.split('/')[1];
}
export function navigationTrail(path:string) {
 const section=navigationSection(path);
 const labels:Record<string,string>={'/':'Accueil','/taches':'Mes tâches','/projets':'Projets','/calendrier':'Événements','/contenus':'Calendrier éditorial','/livrables':'Contenus et livrables','/medias':'Rushs des événements','/equipe':'Membres et invitations','/reglages':'Réglages','/aide':'Aide','/compte':'Mon compte','/invitations':'Rejoindre une équipe'};
 const exact:Record<string,string>={'/projets/nouveau':'Créer un événement','/taches/disponibilites':'Mes disponibilités','/taches/nouveau':'Créer une tâche','/contenus/nouveau':'Créer un contenu','/medias/importer':'Importer les rushs','/livrables/importer':'Importer les livrables','/collectes':'Inviter à déposer','/calendrier/liturgie':'Calendrier liturgique','/compte/suppression':'Départ de l’association','/exploitation':'Suivi technique'};
 const title=exact[path]||(path.endsWith('/travail')?'Préparation et tâches':path.endsWith('/bilan')?'Bilan du projet':path.startsWith('/packs/')?'Aperçu des tâches':section!==path?'Détail':labels[section]||'Votre espace');
 return {section,label:labels[section]||'Votre espace',title};
}
