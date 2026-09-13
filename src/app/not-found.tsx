import Link from 'next/link';
export default function NotFound() { return <section className="card"><h1>Cette page n’existe pas.</h1><p>Retrouvez votre espace depuis l’accueil.</p><Link className="button" href="/">Revenir à l’accueil</Link></section>; }
