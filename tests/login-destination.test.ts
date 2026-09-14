import test from 'node:test';
import assert from 'node:assert/strict';
import {loginDestination} from '../src/modules/identity/login-destination';
test('Connexion : accueil par défaut, association conservée et invitations ciblées',()=>{
 assert.equal(loginDestination(''),'/');assert.equal(loginDestination('/compte'),'/');
 const org='0a928157-aedd-45b8-b117-21e656e4a034';
 assert.equal(loginDestination(`/equipe?organisation=${org}`),`/?organisation=${org}`);
 const invitation='/invitations?token='+'a'.repeat(43);assert.equal(loginDestination(invitation),invitation);
 for(const value of ['https://example.com','//example.com','/invitations?token=bad',invitation+'&redirect=https://example.com'])assert.equal(loginDestination(value),'/');
});
