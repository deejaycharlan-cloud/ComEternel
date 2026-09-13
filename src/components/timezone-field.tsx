'use client';
import { useId, useState } from 'react';
const choices = [
  ['America/Martinique', 'Martinique'],
  ['America/Guadeloupe', 'Guadeloupe'],
  ['America/Cayenne', 'Guyane'],
  ['Europe/Paris', 'France métropolitaine'],
  ['Indian/Reunion', 'La Réunion'],
  ['Indian/Mayotte', 'Mayotte'],
  ['America/Montreal', 'Québec / Montréal'],
  ['Europe/Brussels', 'Belgique'],
  ['Europe/Zurich', 'Suisse'],
  ['Africa/Abidjan', 'Côte d’Ivoire'],
  ['Africa/Dakar', 'Sénégal'],
  ['UTC', 'Temps universel (UTC)'],
];
export function TimezoneField({ label, defaultValue = '' }: { label: string; defaultValue?: string }) {
  const id = useId();
  const [choice, setChoice] = useState(!defaultValue || choices.some(([value]) => value === defaultValue) ? defaultValue : 'custom');
  const [custom, setCustom] = useState(defaultValue);
  return <div><label htmlFor={id}>{label}</label><select id={id} name={choice === 'custom' ? undefined : 'timezone'} value={choice} required aria-describedby={`${id}-help`} onChange={event => setChoice(event.target.value)}><option value="" disabled>Choisir une région…</option>{choices.map(([value, name]) => <option value={value} key={value}>{name}</option>)}<option value="custom">Autre fuseau horaire…</option></select>{choice === 'custom' && <><label htmlFor={`${id}-custom`}>Identifiant du fuseau</label><input id={`${id}-custom`} name="timezone" required value={custom} onChange={event => setCustom(event.target.value)} placeholder="Ex. Africa/Douala" autoCapitalize="none" spellCheck={false} aria-describedby={`${id}-help`}/></>}<p id={`${id}-help`} className="hint">Choisissez la région de votre équipe. Les changements d’heure éventuels sont pris en compte automatiquement.</p></div>;
}
