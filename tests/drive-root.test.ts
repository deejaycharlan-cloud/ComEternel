import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ensureRootFolderName,rootFolderName} from '../src/modules/integrations/direct-drive/google';
test('Le renommage Drive conserve le dossier et refuse celui d’une autre association',async()=>{
 const previous=globalThis.fetch;let name='ComÉternel — Association';let owner='a';let patches=0;
 globalThis.fetch=(async(raw,init)=>{assert.match(String(raw),/\/files\/root-a\?/);if(init?.method==='PATCH'){patches++;assert.deepEqual(JSON.parse(String(init.body)),{name:rootFolderName});name=rootFolderName;return Response.json({id:'root-a'});}return Response.json({id:'root-a',name,mimeType:'application/vnd.google-apps.folder',trashed:false,appProperties:{cometernelOrg:owner,cometernelFolder:`root:${owner}`}});}) as typeof fetch;
 try{assert.equal(await ensureRootFolderName('test','root-a','a'),'root-a');await ensureRootFolderName('test','root-a','a');assert.equal(patches,1);owner='b';await assert.rejects(ensureRootFolderName('test','root-a','a'));assert.equal(patches,1);}finally{globalThis.fetch=previous;}
});
