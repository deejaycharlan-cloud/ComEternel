import Link from 'next/link';
import {navigationTrail} from '../modules/identity/navigation-route';
export function NavigationTrail({path,organizationId,canCreate}:{path:string;organizationId:string;canCreate:boolean}) {
 const {section,label,title}=navigationTrail(path),href=(p:string)=>`${p}?organisation=${organizationId}`;
 return <div className="navigation-context"><nav aria-label="Fil d’Ariane"><ol><li>{path==='/'?<span aria-current="page">Accueil</span>:<Link href={href('/')}>Accueil</Link>}</li>{path!=='/'&&<li>{section===path?<span aria-current="page">{label}</span>:<Link href={href(section)}>{label}</Link>}</li>}{path!==section&&<li><span aria-current="page">{title}</span></li>}</ol></nav><div className="navigation-shortcuts"><Link href={href('/medias/importer')}>↑ Déposer des rushs</Link>{canCreate&&<Link href={href('/projets/nouveau')}>+ Événement</Link>}</div></div>;
}
