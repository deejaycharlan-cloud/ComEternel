export const profiles = {
  coordinateur: { label: 'Coordinateur', title: 'Une vue claire pour avancer ensemble.', focus: 'décisions à préparer', link: '/projets', action: 'Voir les projets', task: 'Préciser le public et le message de la rencontre' },
  administrateur: { label: 'Administrateur', title: 'Prenez soin de votre espace commun.', focus: 'accès à préparer', link: '/equipe', action: 'Voir l’équipe', task: 'Préparer les invitations de l’équipe' },
  infographiste: { label: 'Infographiste', title: 'Donnez forme au message.', focus: 'créations à préparer', link: '/contenus', action: 'Voir les contenus', task: 'Préparer la première proposition d’affiche' },
  monteur: { label: 'Monteur vidéo', title: 'Racontez les moments qui comptent.', focus: 'montages à préparer', link: '/medias', action: 'Voir les médias', task: 'Préparer le plan du montage récapitulatif' },
  photographe: { label: 'Photographe / vidéaste', title: 'Préparez les regards à partager.', focus: 'captations à préparer', link: '/calendrier', action: 'Voir le calendrier', task: 'Préparer la liste des prises de vue' },
  publication: { label: 'Publication / community manager', title: 'Le bon message, au bon moment.', focus: 'diffusions à préparer', link: '/contenus', action: 'Voir les contenus', task: 'Préparer le texte d’invitation' },
  validation: { label: 'Responsable validation', title: 'Relisez avec attention et confiance.', focus: 'relectures à préparer', link: '/contenus', action: 'Voir les contenus', task: 'Relire le brouillon du message d’invitation' },
  membre: { label: 'Membre standard', title: 'Votre contribution fait la différence.', focus: 'missions à examiner', link: '/taches', action: 'Voir mes tâches', task: 'Examiner une proposition de soutien à l’accueil' },
} as const;
export type Profile = keyof typeof profiles;
export const demoProjects = [
  { id: 'rencontre', title: 'Rencontre des bénévoles', kind: 'Événement', date: '2026-09-20', displayDate: '20 septembre 2026', status: 'Préparation', description: 'Accueillir les bénévoles et présenter les prochaines actions.' },
  { id: 'solidarite', title: 'Une semaine de solidarité', kind: 'Campagne', date: '2026-09-23', displayDate: '23 septembre 2026', status: 'Brief à préciser', description: 'Inviter les habitants à participer aux actions de solidarité.' },
  { id: 'partage', title: 'Soirée de partage', kind: 'Événement', date: '2026-09-27', displayDate: '27 septembre 2026', status: 'Préparation', description: 'Préparer un temps de rencontre ouvert à tous.' },
];
