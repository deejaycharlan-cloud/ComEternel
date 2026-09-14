'use client';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
export function TaskToolbar({organizationId,mine,view}:{organizationId:string;mine:boolean;view:'liste'|'tableau'}) {
 const router=useRouter();
 const change=(scope:string,presentation:string)=>router.push(`/taches?organisation=${encodeURIComponent(organizationId)}&portee=${scope}&vue=${presentation}`,{scroll:false});
 return <div className="task-toolbar-compact"><div className="task-filter-selects"><label><span className="task-filter-label">Tâches affichées</span><select aria-label="Tâches affichées" value={mine?'moi':'equipe'} onChange={e=>change(e.target.value,view)}><option value="moi">Mes missions</option><option value="equipe">Toute l’équipe</option></select></label><label><span className="task-filter-label">Présentation</span><select aria-label="Présentation des tâches" value={view} onChange={e=>change(mine?'moi':'equipe',e.target.value)}><option value="liste">Liste</option><option value="tableau">Tableau</option></select></label></div><Link className="button" href={`/taches/nouveau?organisation=${organizationId}`}>+ Ajouter une tâche</Link></div>;
}
