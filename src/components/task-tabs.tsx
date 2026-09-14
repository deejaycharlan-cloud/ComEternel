import Link from 'next/link';
export function TaskTabs({organizationId,active}:{organizationId:string;active:'tasks'|'availability'}) {
 return <nav className="task-switch task-page-tabs" aria-label="Tâches et disponibilités"><Link href={`/taches?organisation=${organizationId}`} aria-current={active==='tasks'?'page':undefined}>Mes tâches</Link><Link href={`/taches/disponibilites?organisation=${organizationId}`} aria-current={active==='availability'?'page':undefined}>Mes disponibilités</Link></nav>;
}
