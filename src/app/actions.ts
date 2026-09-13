'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getDb } from '../db/client';
import { currentSession } from '../modules/identity/session';
import { teamService, AccessError } from '../modules/team/service';
export type FormState = { status: 'idle' | 'error' | 'success'; message: string };
export async function createOrganization(_previous: FormState, form: FormData): Promise<FormState> {
  try {
    const actor = await currentSession(); if (!actor) return { status: 'error', message: 'Connectez-vous pour créer votre espace.' };
    await teamService(getDb()).createOrganization(actor, { name: form.get('name'), timezone: form.get('timezone') });
  } catch (error) { return { status: 'error', message: error instanceof z.ZodError ? error.issues.some(issue => issue.path.includes('timezone')) ? 'Choisissez une région dans la liste ou renseignez un identifiant de fuseau valide.' : 'Le nom de l’espace doit contenir entre 2 et 120 caractères.' : error instanceof AccessError ? error.message : 'Enregistrement impossible. Vérifiez le nom, le fuseau et la disponibilité de la base. Vos saisies sont conservées.' }; }
  revalidatePath('/reglages'); revalidatePath('/compte');
  return { status: 'success', message: 'Espace enregistré ; vous en êtes administrateur.' };
}
