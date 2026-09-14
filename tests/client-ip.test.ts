import {test} from 'node:test';
import assert from 'node:assert/strict';
import {clientIp} from '../src/modules/security/client-ip';
test('IP : ignorer les en-têtes locaux et isoler les clients du proxy Vercel',()=>{
 const h=new Headers({'x-vercel-forwarded-for':'203.0.113.4','x-forwarded-for':'192.0.2.8'});
 assert.equal(clientIp(h,false),'127.0.0.1');assert.equal(clientIp(h,true),'203.0.113.4');
 assert.equal(clientIp(new Headers({'x-forwarded-for':'198.51.100.2'}),true),'198.51.100.2');
 assert.equal(clientIp(new Headers({'x-vercel-forwarded-for':'not-an-ip'}),true),'127.0.0.1');
 assert.equal(clientIp(new Headers({'x-vercel-forwarded-for':'2001:db8::1'}),true),'2001:db8::1');
});
