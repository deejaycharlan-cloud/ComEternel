import { dayDifference, isoDate, shiftDate } from '../programme/dates';
import { PACK_VERSION, templateSteps, type PackName, type PackPlan } from './models';
export function planPack(pack: PackName, anchorDate: string, today: string, shift: boolean, projectRevision: number, briefRevision: number, occurrenceId: string | null): PackPlan {
  isoDate.parse(anchorDate); isoDate.parse(today);
  const steps = templateSteps.filter(s => s.packs.includes(pack));
  const shiftedDays = shift ? Math.max(0, dayDifference(shiftDate(anchorDate, Math.min(...steps.map(s => s.offset))), today)) : 0;
  return { pack, version: PACK_VERSION, anchorDate, today, shiftedDays, projectRevision, briefRevision, occurrenceId, scopeKey: occurrenceId || 'project', rows: steps.map(s => ({ key:s.key,title:s.title,description:s.description,format:s.format,profession:s.profession,originalDueDate:shiftDate(anchorDate,s.offset),dueDate:shiftDate(anchorDate,s.offset+shiftedDays),selected:!s.optional,suggestedMemberId:null })) };
}
export function hasCycle(edges: {taskId:string;dependsOnId:string}[]) {
  const visiting = new Set<string>(), visited = new Set<string>();
  function visit(id:string):boolean { if(visiting.has(id)) return true; if(visited.has(id)) return false; visiting.add(id); if(edges.filter(e=>e.taskId===id).some(e=>visit(e.dependsOnId))) return true; visiting.delete(id);visited.add(id);return false; }
  return edges.some(e=>visit(e.taskId));
}
