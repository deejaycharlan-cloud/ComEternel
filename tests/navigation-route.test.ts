import test from 'node:test';
import assert from 'node:assert/strict';
import {navigationSection,navigationTrail} from '../src/modules/identity/navigation-route';
test('Navigation : chaque sous-page conserve sa rubrique de travail',()=>{
 const cases={'/':'/','/livrables/importer':'/livrables','/contenus/nouveau':'/livrables','/contenus/123':'/livrables','/contenus':'/contenus','/medias/importer':'/medias','/collectes':'/medias','/packs/123':'/taches','/projets/123/travail':'/projets','/exploitation':'/reglages'};
 for(const [path,expected] of Object.entries(cases))assert.equal(navigationSection(path),expected,path);
});
test('Repères : les formulaires et étapes ont des titres explicites',()=>{
 assert.deepEqual(navigationTrail('/livrables/importer'),{section:'/livrables',label:'Contenus et livrables',title:'Importer les livrables'});
 assert.equal(navigationTrail('/projets/123/travail').title,'Préparation et tâches');
 assert.equal(navigationTrail('/collectes').title,'Inviter à déposer');
 assert.equal(navigationTrail('/compte').title,'Mon compte');
});
