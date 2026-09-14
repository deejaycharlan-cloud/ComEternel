import test from 'node:test';
import assert from 'node:assert/strict';
import {actionComment} from '../src/modules/work/comment';
test('Actions courantes : commentaire facultatif, historique conservé',()=>{
 assert.equal(actionComment('  ',false,'Mission acceptée'),'Mission acceptée');
 assert.equal(actionComment(' OK ',false,'Action'),'OK');
 assert.throws(()=>actionComment('x'.repeat(1001),false,'Action'));
});
test('Refus et blocage : une explication reste obligatoire',()=>{
 for(const text of ['', '   ', 'Non'])assert.throws(()=>actionComment(text,true,'Action'));
 assert.equal(actionComment(' Photos manquantes ',true,'Action'),'Photos manquantes');
});
