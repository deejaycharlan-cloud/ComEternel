import Link from 'next/link';
import { requireSession } from '../identity/session';
import { getDb } from '../../db/client';
import { currentWorkspace } from '../identity/workspace';
export async function programmeContext(requested?: string) {
  const actor = await requireSession(); const db = getDb(); const spaces = await currentWorkspace();
  const org = requested ? spaces.find(s => s.id === requested) : spaces[0];
  return { actor, db, org, spaces };
}
export function MissingSpace() { return <section className="card"><h1>Espace indisponible.</h1><p>Choisissez une association accessible ou créez votre espace depuis Mon compte.</p><Link href="/compte">Mon compte →</Link></section>; }
export function SpaceNavigation({ spaces, selected, path }: { spaces: { id: string; name: string }[]; selected: string; path: string }) { if(path!=='/')return null; return <nav className="quick-actions" aria-label="Changer d’association">{spaces.map(s => <Link key={s.id} className="button secondary" aria-current={s.id === selected ? 'page' : undefined} href={`${path}?organisation=${s.id}`}>{s.name}</Link>)}</nav>; }
