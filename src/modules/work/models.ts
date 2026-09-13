export const requestLabels = { received: 'Reçue', clarify: 'À préciser', accepted: 'Acceptée', deferred: 'Reportée', refused: 'Refusée' } as const;
export const taskLabels = { todo: 'À faire', doing: 'En cours', blocked: 'Bloquée', review: 'À valider', done: 'Terminée' } as const;
export const missionLabels = { unassigned: 'À attribuer', proposed: 'Mission proposée', accepted: 'Mission acceptée', refused: 'Mission refusée' } as const;
export type TaskStatus = keyof typeof taskLabels;
export type RequestStatus = keyof typeof requestLabels;
export const requestTransitions: Record<RequestStatus, RequestStatus[]> = { received: ['clarify','accepted','deferred','refused'], clarify: ['received','accepted','deferred','refused'], accepted: ['deferred'], deferred: ['received','clarify','accepted','refused'], refused: ['received'] };
export const taskTransitions: Record<TaskStatus, TaskStatus[]> = { todo: ['doing','blocked'], doing: ['blocked','review','done'], blocked: ['todo','doing'], review: ['doing','done'], done: ['todo'] };
export const PACK_VERSION = 1;
export const packNames = { essential: 'Essentiel', standard: 'Standard', extended: 'Étendu' } as const;
export type PackName = keyof typeof packNames;
export const templateSteps = [
  { key: 'brief', title: 'Confirmer les informations pratiques', offset: -21, format: 'Brief', profession: 'coordinateur', description: 'Vérifier le public, le message, le lieu et les informations utiles.', packs: ['essential','standard','extended'], optional: false },
  { key: 'visual', title: 'Préparer le support principal', offset: -14, format: 'Affiche / visuel', profession: 'infographiste', description: 'Créer un support lisible et conserver les informations essentielles en texte.', packs: ['standard','extended'], optional: false },
  { key: 'invitation', title: 'Préparer le message d’invitation', offset: -7, format: 'Message / newsletter', profession: 'publication', description: 'Préparer le texte et le lien d’informations pratiques. La diffusion reste distincte.', packs: ['essential','standard','extended'], optional: false },
  { key: 'print', title: 'Adapter le support pour l’impression', offset: -5, format: 'Impression', profession: 'infographiste', description: 'Préparer un support imprimable si ce canal est utile au public.', packs: ['extended'], optional: false },
  { key: 'reminder', title: 'Préparer un rappel', offset: -3, format: 'Message court', profession: 'publication', description: 'Vérifier les informations avant de préparer un rappel.', packs: ['standard','extended'], optional: false },
  { key: 'capture', title: 'Préparer la collecte de souvenirs', offset: 0, format: 'Collecte', profession: 'photographe', description: 'Préparer la collecte et les autorisations. Aucun lien de dépôt n’est créé à cette étape.', packs: ['standard','extended'], optional: false },
  { key: 'selection', title: 'Sélectionner les éléments partageables', offset: 2, format: 'Sélection', profession: 'photographe', description: 'Repérer les éléments utiles et les droits à vérifier.', packs: ['extended'], optional: false },
  { key: 'recap', title: 'Préparer le bilan et le suivi', offset: 7, format: 'Bilan / message', profession: 'coordinateur', description: 'Rassembler les retours et les suites à donner, sans clôturer les tâches restantes.', packs: ['essential','standard','extended'], optional: false },
  { key: 'video', title: 'Préparer un récapitulatif vidéo (facultatif)', offset: 7, format: 'Vidéo', profession: 'monteur', description: 'À retenir seulement si les moyens, les autorisations et l’utilité sont confirmés.', packs: ['extended'], optional: true },
];
export type PackRow = { key: string; title: string; description: string; format: string; originalDueDate: string; dueDate: string; selected: boolean; suggestedMemberId: string | null; profession: string };
export type PackPlan = { pack: PackName; version: number; projectRevision: number; briefRevision: number; anchorDate: string; scopeKey: string; occurrenceId: string | null; rows: PackRow[]; shiftedDays: number; today: string };
