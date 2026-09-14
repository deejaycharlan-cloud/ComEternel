import type {PackRow} from './models';
type Person={member:{id:string;professions:string[]}};
type Availability={memberId:string;startDate:string;endDate:string;capacity:string};
export function suggestAssignments(rows:PackRow[],people:Person[],availability:Availability[],tasks:{assigneeId:string|null;status:string}[]) {
 const loads=new Map(people.map(p=>[p.member.id,tasks.filter(t=>t.assigneeId===p.member.id&&t.status!=='done').length]));
 return rows.map(row=>{
  const options=people.filter(p=>p.member.professions.includes(row.profession)).map(p=>{
   const declarations=availability.filter(a=>a.memberId===p.member.id&&a.startDate<=row.dueDate&&a.endDate>=row.dueDate);
   const capacity=declarations.some(a=>a.capacity==='unavailable')?3:declarations.some(a=>a.capacity==='limited')?2:declarations.some(a=>a.capacity==='available')?0:1;
   return {id:p.member.id,capacity,load:loads.get(p.member.id)||0};
  }).filter(p=>p.capacity!==3).sort((a,b)=>a.capacity-b.capacity||a.load-b.load||a.id.localeCompare(b.id));
  const id=options[0]?.id||null;if(id&&row.selected)loads.set(id,(loads.get(id)||0)+1);
  return {...row,suggestedMemberId:id};
 });
}
