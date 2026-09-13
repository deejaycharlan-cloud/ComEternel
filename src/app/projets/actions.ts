'use server';
import {after} from 'next/server';
import {syncCalendar} from '../../modules/integrations/calendar/service';
import { currentSession } from '../../modules/identity/session';
import { getDb } from '../../db/client';
import { programmeService, ProgrammeError } from '../../modules/programme/service';
import { AccessError } from '../../modules/team/service';
import { projectInput, liturgyInput } from '../../modules/programme/validation';
import { scheduleOccurrences } from '../../modules/programme/dates';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
export type ProgrammeState = { status: 'idle' | 'error' | 'success' | 'preview'; message: string; href?: string };
export async function programmeAction(_state: ProgrammeState, form: FormData): Promise<ProgrammeState> {
  const get = (name: string) => String(form.get(name) || '');
  try {
    const actor = await currentSession(); if (!actor) throw new AccessError('Reconnectez-vous ; les champs restent disponibles.');
    const service = programmeService(getDb()); const orgId = get('organizationId'); const projectId = get('projectId'); const revision = Number(get('revision')); const operation = get('operation');
    let href: string | undefined;
    if (operation === 'create') {
      const input = { ...Object.fromEntries(form.entries()), allDay: get('allDay') === 'true', endDate: get('allDay') === 'true' && get('kind') === 'event' ? get('startDate') : get('endDate'), occurrenceCount: Number(get('occurrenceCount')), startTime: get('startTime') || null, endTime: get('endTime') || null };
      if (get('intent') === 'preview') { if (!await service.canCreate(actor, orgId)) throw new AccessError(); const value = projectInput.parse(input); const dates = scheduleOccurrences(value); return { status: 'preview', message: value.kind === 'campaign' ? `Aperçu : campagne du ${value.startDate} au ${value.endDate}, sans événement créé. Rien n’est enregistré.` : `Aperçu : ${dates.length} occurrence(s), du ${dates[0].startDate} au ${dates.at(-1)!.endDate}, fuseau ${value.timezone}. Rien n’est enregistré.` }; }
      const p = await service.create(actor, orgId, input); href = `/projets/${p.id}?organisation=${orgId}`;
    } else if (operation === 'occurrence') await service.changeOccurrence(actor, orgId, projectId, revision, { occurrenceId: get('occurrenceId'), action: z.enum(['reschedule','cancel']).parse(get('change')), date: get('date'), endDate: get('endDate'), startTime: get('startTime'), endTime: get('endTime'), reason: get('reason') });
    else if (operation === 'project') await service.changeProject(actor, orgId, projectId, revision, { action: z.enum(['reschedule','cancel','archive']).parse(get('change')), date: get('date'), endDate: get('endDate'), startTime: get('startTime'), endTime: get('endTime'), reason: get('reason') });
    else if (operation === 'brief') await service.updateBrief(actor, orgId, projectId, revision, { title: get('title'), objective: get('objective'), audience: get('audience'), message: get('message'), resources: get('resources'), location: get('location'), practicalInfo: get('practicalInfo') });
    else if (operation === 'access') await service.setAccess(actor, orgId, projectId, get('memberId'), form.getAll('permissions').map(String));
    else if (operation === 'liturgy') await service.saveLiturgy(actor, orgId, liturgyInput.parse({ title: get('title'), date: get('date'), tradition: get('tradition'), localCalendar: get('localCalendar'), source: get('source'), verified: get('verified') === 'on' }), get('id') || undefined, Number(get('revision')) || undefined);
    else throw new AccessError();
    if(['create','occurrence','project','brief'].includes(operation))after(()=>syncCalendar(orgId));
    revalidatePath('/projets'); revalidatePath('/calendrier'); revalidatePath('/calendrier/liturgie'); revalidatePath('/'); if (projectId) revalidatePath(`/projets/${projectId}`);
    return { status: 'success', message: 'Enregistrement confirmé. Les tâches, fichiers et publications ne sont pas modifiés automatiquement.', href };
  } catch (error) { return { status: 'error', message: error instanceof ProgrammeError || error instanceof AccessError ? error.message : error instanceof z.ZodError ? 'Vérifiez les champs : noms, dates, personnes et informations obligatoires.' : error instanceof Error && error.message.startsWith('Heure ambiguë') ? error.message : 'Enregistrement impossible. Vos saisies sont conservées ; vérifiez les dates puis réessayez.' }; }
}
