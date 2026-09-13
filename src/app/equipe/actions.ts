'use server';
import { revalidatePath } from 'next/cache';
import { currentSession } from '../../modules/identity/session';
import { teamService, AccessError } from '../../modules/team/service';
import { getDb } from '../../db/client';
import { sendMail } from '../../modules/identity/mail';
import type { FormState } from '../actions';
export async function teamAction(_previous: FormState, data: FormData): Promise<FormState> {
  try {
    const actor = await currentSession(); if (!actor) throw new AccessError('Connectez-vous à nouveau.');
    const orgId = String(data.get('organizationId') || ''); const kind = data.get('operation'); const service = teamService(getDb());
    const grants = { role: data.get('role'), professions: data.getAll('professions'), permissions: data.getAll('permissions') };
    if (kind === 'invite') {
      const invitation = await service.invite(actor, orgId, { ...grants, email: data.get('email') });
      try { await sendMail(invitation.email, 'Invitation à un espace ComÉternel', `Invitation personnelle, à accepter avec la même adresse. Expire dans 48 heures.\n\n${process.env.BETTER_AUTH_URL}/invitations?token=${invitation.token}`); }
      catch { revalidatePath('/equipe'); return { status: 'error', message: 'Invitation créée, mais le service email n’a pas accepté le message. Vérifiez sa configuration, révoquez cette invitation puis recréez-la.' }; }
    } else if (kind === 'revoke-invitation') await service.revokeInvitation(actor, orgId, String(data.get('id')));
    else if (kind === 'remove-member') await service.changeMember(actor, orgId, String(data.get('id')), null);
    else if (kind === 'update-member') await service.changeMember(actor, orgId, String(data.get('id')), grants);
    else throw new AccessError();
    revalidatePath('/equipe'); revalidatePath('/compte'); revalidatePath('/reglages');
    return { status: 'success', message: kind === 'invite' ? (process.env.AUTH_MAIL_MODE === 'local' ? 'Invitation créée ; message déposé dans la boîte de test locale.' : 'Invitation créée ; message accepté par le service email.') : kind === 'remove-member' ? 'Accès retiré et sessions révoquées. Les éventuels partages Google externes restent à vérifier.' : 'Modification enregistrée.' };
  } catch (error) { return { status: 'error', message: error instanceof AccessError ? error.message : 'Opération impossible. Vérifiez les champs puis réessayez.' }; }
}
