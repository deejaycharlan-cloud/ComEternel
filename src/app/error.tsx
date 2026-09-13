'use client';
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <section className="card" role="alert"><h1>Cette page n’a pas pu s’ouvrir.</h1><p>Réessayez dans un instant. Aucune suppression de données n’a été déclenchée.</p><button onClick={reset}>Réessayer</button></section>; }
