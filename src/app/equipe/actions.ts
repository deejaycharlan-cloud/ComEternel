'use server';
import {revalidatePath} from 'next/cache';
import {currentSession} from '../../modules/identity/session';
import {teamService,AccessError} from '../../modules/team/service';
import {getDb} from '../../db/client';
import {deliverInvitation} from '../../modules/team/invitation-mail';
import {mailConfig} from '../../config/deployment';
import type {FormState} from '../actions';
export type TeamFormState=FormState & {invitationCode?:string};
export async function teamAction(_previous:TeamFormState,data:FormData):Promise<TeamFormState>{
 try{
  const actor=await currentSession();if(!actor)throw new AccessError('Connectez-vous à nouveau pour continuer.');
  const org=String(data.get('organizationId')||''),kind=String(data.get('operation')),service=teamService(getDb());
  const grants={role:data.get('role'),professions:data.getAll('professions'),permissions:data.getAll('permissions')};
  let invitation:{id:string;email:string;token:string}|null=null;
  const delivery=String(data.get('delivery')||'email');
  if(!['email','code'].includes(delivery))throw new AccessError('Choisissez un mode d’invitation.');
  if(kind==='approve-join'||kind==='resend-invitation'||(kind==='invite'&&delivery==='email')){
   try{mailConfig();}catch{throw new AccessError('Le service email est indisponible. Aucune invitation n’a été créée.');}
  }
  if(kind==='approve-join'||kind==='reject-join')invitation=await service.reviewJoin(actor,org,String(data.get('id')),kind==='approve-join',grants);
  else if(kind==='invite')invitation=await service.invite(actor,org,{...grants,email:data.get('email')});
  else if(kind==='resend-invitation')invitation=await service.resendInvitation(actor,org,String(data.get('id')));
  else if(kind==='revoke-invitation')await service.revokeInvitation(actor,org,String(data.get('id')));
  else if(kind==='remove-member')await service.changeMember(actor,org,String(data.get('id')),null);
  else if(kind==='update-member')await service.changeMember(actor,org,String(data.get('id')),grants);
  else throw new AccessError();
  let result:TeamFormState={status:'success',message:kind==='reject-join'?'Demande refusée.':kind==='revoke-invitation'?'Invitation annulée.':kind==='remove-member'?'Accès retiré.':'Accès enregistrés.'};
  if(invitation){
   if(kind==='invite'&&delivery==='code')result={status:'success',message:`Code créé pour ${invitation.email}. Aucun email envoyé.`,invitationCode:invitation.token};
   else {const sent=await deliverInvitation(getDb(),actor.user.id,org,invitation);result={status:sent?'success':'error',message:sent?`Invitation adressée à ${invitation.email}, acceptée par le service d’envoi. La personne doit encore l’accepter.`:`Invitation enregistrée, mais l’envoi à ${invitation.email} a échoué. Utilisez « Renvoyer l’email » dans le suivi des invitations.`};}
  }
  revalidatePath('/equipe');revalidatePath('/','layout');return result;
 }catch(error){return {status:'error',message:error instanceof AccessError?error.message:'Opération impossible. Réessayez ; consultez le suivi avant de recréer une invitation.'};}
}
