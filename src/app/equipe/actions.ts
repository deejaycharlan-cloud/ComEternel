'use server';
import { revalidatePath } from 'next/cache';
import { currentSession } from '../../modules/identity/session';
import { teamService, AccessError } from '../../modules/team/service';
import { getDb } from '../../db/client';
import { sendMail } from '../../modules/identity/mail';
import type { FormState } from '../actions';
export type TeamFormState = FormState & { invitationCode?: string };
export async function teamAction(_previous: TeamFormState, data: FormData): Promise<TeamFormState> {
  try {
    const actor = await currentSession(); if (!actor) throw new AccessError('Connectez-vous à nouveau.');
    const orgId = String(data.get('organizationId') || ''); const kind = data.get('operation'); const service = teamService(getDb());
    const grants = { role: data.get('role'), professions: data.getAll('professions'), permissions: data.getAll('permissions') };
    if (kind === 'approve-join' || kind === 'reject-join') {
      const invitation = await service.reviewJoin(actor, orgId, String(data.get('id')),kind==='approve-join',grants);
      if (invitation) {
        try { await sendMail(invitation.email,'Votre demande ComÉternel est acceptée',`Acceptez votre invitation avec cette adresse email. Valable 48 heures.\n\n${process.env.BETTER_AUTH_URL}/invitations?token=${invitation.token}`); }
        catch { revalidatePath('/equipe'); return {status:'error',message:'Demande approuvée, mais email non envoyé. Révoquez l’invitation puis renvoyez-la lorsque le service email sera disponible.'}; }
      }
    } else if (kind === 'invite') {
      const delivery = String(data.get('delivery') || 'email');
      if (!['email','code'].includes(delivery)) throw new AccessError('Choisissez un mode d’invitation.');
      const invitation = await service.invite(actor, orgId, { ...grants, email: data.get('email') });
      if (delivery === 'code') { revalidatePath('/equipe'); return { status: 'success', message: 'Code créé. Transmettez-le à la personne invitée. Il est valable 48 heures et utilisable une seule fois avec son adresse email vérifiée.', invitationCode: invitation.token }; }
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
