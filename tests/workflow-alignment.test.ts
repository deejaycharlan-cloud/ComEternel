import test from 'node:test';
import assert from 'node:assert/strict';
import {rushWindowOpen} from '../src/modules/production/rush-window';
import {suggestAssignments} from '../src/modules/work/suggestions';
import {planPack} from '../src/modules/work/planning';
test('Rushs : début exact, fuseau local, après événement et annulation',()=>{
 const e={startDate:'2026-09-14',startAt:null,status:'scheduled'};
 assert.equal(rushWindowOpen(e,'America/Martinique',new Date('2026-09-14T03:59:59Z')),false);
 assert.equal(rushWindowOpen(e,'America/Martinique',new Date('2026-09-14T04:00:00Z')),true);
 assert.equal(rushWindowOpen(e,'America/Martinique',new Date('2026-10-14T04:00:00Z')),true);
 const timed={...e,startAt:new Date('2026-09-14T18:00:00Z')};
 assert.equal(rushWindowOpen(timed,'UTC',new Date('2026-09-14T17:59:59Z')),false);
 assert.equal(rushWindowOpen(timed,'UTC',timed.startAt),true);
 assert.equal(rushWindowOpen({...e,status:'cancelled'},'UTC',new Date('2026-10-01')),false);
});
test('Suggestions : métier, absence, charge et aucune attribution forcée',()=>{
 const rows=planPack('extended','2026-10-30','2026-09-14',false,1,1,null).rows;
 const people=['a','b','c'].map(id=>({member:{id,professions:['infographiste']}}));
 const availability=[{memberId:'a',startDate:'2026-01-01',endDate:'2026-12-31',capacity:'unavailable'}];
 const proposed=suggestAssignments(rows,people,availability,[{assigneeId:'b',status:'doing'}]);
 assert.equal(proposed.find(r=>r.key==='visual')?.suggestedMemberId,'c');
 assert.equal(proposed.find(r=>r.key==='video')?.suggestedMemberId,null);
 assert.equal(proposed.find(r=>r.key==='teaser')?.selected,false);
 assert.equal(proposed.find(r=>r.key==='interview')?.selected,false);
 assert.ok(rows.every(r=>r.suggestedMemberId===null));
 const conflict=[...availability,{memberId:'a',startDate:'2026-01-01',endDate:'2026-12-31',capacity:'available'}];
 assert.ok(suggestAssignments(rows,people,conflict,[]).every(r=>r.suggestedMemberId!=='a'));
});
