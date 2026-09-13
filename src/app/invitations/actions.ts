'use server';
import { currentSession } from '../../modules/identity/session';
import { teamService, AccessError } from '../../modules/team/service';
import { getDb } from '../../db/client';
import { revalidatePath } from 'next/cache';
import type { FormState } from '../actions';
export async function acceptInvitation(_previous: FormState, data: FormData): Promise<FormState> { try { const actor = await currentSession(); if (!actor) throw new AccessError('Connectez-vous avec l’adresse invitée, puis revenez sur cette page.'); await teamService(getDb()).accept(actor, String(data.get('token') || '')); revalidatePath('/compte'); revalidatePath('/equipe'); return { status: 'success', message: 'Invitation acceptée. Votre espace est accessible dans Mon compte.' }; } catch (error) { return { status: 'error', message: error instanceof AccessError ? error.message : 'Invitation indisponible. Vérifiez le code, l’adresse de connexion et sa validité.' }; } }
