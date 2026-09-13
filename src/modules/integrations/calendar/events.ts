import {shiftDate} from '../../programme/dates';
import type {projects,occurrences} from '../../../db/programme-schema';
export function googleEvent(project:typeof projects.$inferSelect,event:typeof occurrences.$inferSelect){return {
 id:'ce'+event.id.replaceAll('-',''), summary:project.title,location:project.location,
 description:'Géré depuis ComÉternel. Modifiez les dates et le lieu dans ComÉternel.',
 status:event.status==='cancelled'||project.status==='cancelled'?'cancelled':'confirmed',
 start:project.allDay?{date:event.startDate}:{dateTime:event.startAt!.toISOString(),timeZone:project.timezone},
 end:project.allDay?{date:shiftDate(event.endDate,1)}:{dateTime:event.endAt!.toISOString(),timeZone:project.timezone},
 extendedProperties:{private:{cometernelAssociation:project.organizationId,cometernelEvent:event.id}},
};}
