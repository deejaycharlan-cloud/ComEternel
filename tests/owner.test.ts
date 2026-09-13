import test from 'node:test';
import assert from 'node:assert/strict';
import { canCreateTeam } from '../src/config/owner';
test('chaque identité vérifiée peut créer sa propre association',()=>{
 for (const email of ['responsable-a@example.test','responsable-b@example.test']) {
  assert.equal(canCreateTeam({email,emailVerified:true}),true);
  assert.equal(canCreateTeam({email,emailVerified:false}),false);
 }
});
