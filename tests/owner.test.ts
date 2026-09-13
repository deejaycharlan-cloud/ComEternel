import test from 'node:test';
import assert from 'node:assert/strict';
import { canCreateTeam } from '../src/config/owner';
test('seul le propriétaire vérifié peut devenir administrateur initial en ligne',()=>{
 const env={VERCEL:'1',OWNER_EMAIL:'owner@example.test'};
 assert.equal(canCreateTeam({email:'owner@example.test',emailVerified:true},env),true);
 assert.equal(canCreateTeam({email:'member@example.test',emailVerified:true},env),false);
 assert.equal(canCreateTeam({email:'owner@example.test',emailVerified:false},env),false);
 assert.equal(canCreateTeam({email:'owner@example.test',emailVerified:true},{VERCEL:'1'}),false);
});
