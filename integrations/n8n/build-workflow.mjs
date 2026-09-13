import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Offline authoring only. This script never contacts n8n, ComÉternel or Google.
const dir = path.dirname(fileURLToPath(import.meta.url));
const nodes = [];
const connections = {};
const expr = (body) => `={{ ${body} }}`;
const job = "$('Réserver un transfert').item.json.job";
const config = "$('Configuration du test').item.json";
const resolved = "$('Identifiant Drive retenu').item.json.driveFileId";
const api = (suffix) => expr(`${config}.appBaseUrl + '/api/integrations/n8n/jobs' + ${suffix}`);
const jobApi = (suffix) => api(`'/' + encodeURIComponent(${job}.id) + '${suffix}'`);
const fields = 'id,name,mimeType,size,sha256Checksum,parents,trashed,appProperties';
const googleFile = expr(`'https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(${resolved})`);
const params = (pairs) => ({ parameters: Object.entries(pairs).map(([name, value]) => ({ name, value })) });

function node(name, type, version, parameters, position, extra = {}) {
  nodes.push({ id: randomUUID(), name, type: `n8n-nodes-base.${type}`, typeVersion: version, position, parameters, ...extra });
}
function link(source, target, output = 0) {
  connections[source] ??= { main: [] };
  while (connections[source].main.length <= output) connections[source].main.push([]);
  connections[source].main[output].push({ node: target, type: 'main', index: 0 });
}
function condition(name, expression, position) {
  node(name, 'if', 2.3, {
    conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 3 }, combinator: 'and', conditions: [
      { id: randomUUID(), leftValue: expr(expression), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } },
    ] }, options: {},
  }, position);
}
const response = (extra = {}) => ({ response: { responseFormat: 'json', ...extra } });
function http(name, service, parameters, position, { failure = 'Signaler un échec', retry = true } = {}) {
  node(name, 'httpRequest', 4.5, {
    authentication: service === 'app' ? 'genericCredentialType' : 'predefinedCredentialType',
    ...(service === 'app' ? { genericAuthType: 'httpHeaderAuth' } : { nodeCredentialType: 'googleDriveOAuth2Api' }),
    ...parameters,
    options: { timeout: 30000, redirect: { redirect: { followRedirects: false } }, response: response(), ...parameters.options },
  }, position, {
    retryOnFail: retry, ...(retry ? { maxTries: 3, waitBetweenTries: 5000 } : {}),
    onError: 'continueErrorOutput',
    notesInFlow: false,
    notes: service === 'app'
      ? 'Choisir le credential Header Auth ComÉternel : nom Authorization, valeur Bearer suivie du jeton de service. Aucun secret dans les paramètres.'
      : 'Choisir le même credential Google Drive OAuth2 sur tous les nœuds Google. Le compte et le dossier doivent avoir été choisis par le responsable.',
  });
  link(name, failure, 1);
}
function jsonBody(body) { return { sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody: expr(body) }; }
const metadataIdentity = (ref) => `${ref}.id === ${resolved} && ${ref}.trashed === false && ${ref}.mimeType === ${job}.mime && Array.isArray(${ref}.parents) && ${ref}.parents.length === 1 && ${ref}.parents[0] === ${job}.folderId && ${ref}.appProperties?.cometernelJob === ${job}.id`;
const verified = (ref) => `${metadataIdentity(ref)} && String(${ref}.size) === String(${job}.size) && typeof ${ref}.sha256Checksum === 'string' && ${ref}.sha256Checksum.toLowerCase() === ${job}.sha256`;

node('Lancer un seul test', 'manualTrigger', 1, {}, [0, 0]);
node('Configuration du test', 'set', 3.5, { mode: 'raw', jsonOutput: '{"appBaseUrl":"","testEnabled":false}', options: {} }, [220, 0], {
  notesInFlow: true, notes: 'Compléter uniquement après choix du compte Drive, du dossier et de l’instance n8n. URL origine fixe, sans slash final. testEnabled reste false tant que la cible du test n’est pas confirmée. Un seul fichier est réclamé par clic ; aucun déclencheur planifié.',
});
condition('Configuration confirmée', String.raw`(() => { const c = ${config}; return c.testEnabled === true && typeof c.appBaseUrl === 'string' && (/^https:\/\/[A-Za-z0-9.-]+(?::[0-9]{1,5})?$/.test(c.appBaseUrl) || /^http:\/\/(?:localhost|127\.0\.0\.1|host\.docker\.internal)(?::[0-9]{1,5})?$/.test(c.appBaseUrl)); })()`, [440, 0]);
node('Configuration requise', 'stopAndError', 1, { errorMessage: 'Test désactivé : définir l’origine de ComÉternel, les deux credentials et confirmer le dossier de test avant de lancer.' }, [440, 240]);
http('Réserver un transfert', 'app', { method: 'POST', url: api("'/claim'"), ...jsonBody("{ requestId: String($execution.id) }") }, [660, 0], { failure: 'Connexion application impossible' });
node('Connexion application impossible', 'stopAndError', 1, { errorMessage: 'ComÉternel ne peut pas réserver le test. Vérifier la connexion et le credential de service ; aucun résultat Drive n’est déclaré.' }, [660, 240]);
condition('Un transfert disponible', `${job} !== null && typeof ${job} === 'object'`, [880, 0]);
node('Aucun transfert en attente', 'noOp', 1, {}, [880, 240]);
condition('Contrat du fichier valide', `(() => { const j = ${job}; return typeof j.id === 'string' && /^[0-9a-f-]{36}$/i.test(j.id) && typeof j.leaseId === 'string' && j.leaseId.length >= 16 && typeof j.folderId === 'string' && /^[A-Za-z0-9_-]{10,200}$/.test(j.folderId) && typeof j.name === 'string' && j.name.length > 0 && ['image/jpeg','image/png','image/webp','video/mp4','application/pdf'].includes(j.mime) && Number.isSafeInteger(j.size) && j.size > 0 && j.size <= 5242880 && /^[0-9a-f]{64}$/.test(j.sha256) && (j.driveFileId === null || (typeof j.driveFileId === 'string' && /^[A-Za-z0-9_-]{10,200}$/.test(j.driveFileId))); })()`, [1100, 0]);
condition('Identifiant déjà réservé', `typeof ${job}.driveFileId === 'string' && ${job}.driveFileId.length > 0`, [1320, 0]);
http('Générer un identifiant Drive', 'google', { url: 'https://www.googleapis.com/drive/v3/files/generateIds', sendQuery: true, queryParameters: params({ count: '1', space: 'drive', type: 'files' }) }, [1320, 240]);
http('Conserver l’identifiant dans ComÉternel', 'app', { method: 'POST', url: jobApi('/reserve'), ...jsonBody(`{ leaseId: ${job}.leaseId, driveFileId: $('Générer un identifiant Drive').item.json.ids[0] }`) }, [1540, 240]);
node('Identifiant Drive retenu', 'set', 3.5, { mode: 'raw', jsonOutput: expr(`{ driveFileId: $json.driveFileId || ${job}.driveFileId }`), options: {} }, [1760, 0]);
http('Lire le fichier existant', 'google', { url: googleFile, sendQuery: true, queryParameters: params({ fields, supportsAllDrives: 'true' }), options: { response: response({ fullResponse: true, neverError: true }) } }, [1980, 0]);
condition('Fichier déjà présent', "$('Lire le fichier existant').item.json.statusCode === 200", [2200, 0]);
condition('Fichier absent', "$('Lire le fichier existant').item.json.statusCode === 404", [2200, 240]);
http('Créer le fichier vide réservé', 'google', {
  method: 'POST', url: 'https://www.googleapis.com/drive/v3/files', sendQuery: true,
  queryParameters: params({ fields, supportsAllDrives: 'true', ignoreDefaultVisibility: 'true' }),
  ...jsonBody(`{ id: ${resolved}, name: ${job}.name, mimeType: ${job}.mime, parents: [${job}.folderId], appProperties: { cometernelJob: ${job}.id } }`),
  options: { response: response({ fullResponse: true, neverError: true }) },
}, [2420, 240]);
condition('Création ou conflit récupérable', "[200,201,409].includes($('Créer le fichier vide réservé').item.json.statusCode)", [2640, 240]);
http('Relire après création', 'google', { url: googleFile, sendQuery: true, queryParameters: params({ fields, supportsAllDrives: 'true' }), options: { response: response({ fullResponse: true }) } }, [2860, 240]);
node('Métadonnées avant transfert', 'set', 3.5, { mode: 'raw', jsonOutput: expr('$json.body'), options: {} }, [3080, 0]);
condition('Fichier déjà vérifié', verified("$('Métadonnées avant transfert').item.json"), [3300, 0]);
condition('Fichier vide du même transfert', `(() => { const f = $('Métadonnées avant transfert').item.json; return ${metadataIdentity('f')} && String(f.size) === '0'; })()`, [3300, 240]);
http('Télécharger le fichier privé', 'app', {
  url: jobApi('/file'), sendHeaders: true, headerParameters: params({ 'X-Cometernel-Lease': expr(`${job}.leaseId`) }),
  options: { response: response({ responseFormat: 'file', outputPropertyName: 'data' }) },
}, [3520, 240]);
http('Écrire le contenu dans Drive', 'google', {
  method: 'PATCH', url: expr(`'https://www.googleapis.com/upload/drive/v3/files/' + encodeURIComponent(${resolved})`),
  sendQuery: true, queryParameters: params({ uploadType: 'media', supportsAllDrives: 'true', fields: 'id' }),
  sendHeaders: true, headerParameters: params({ 'Content-Type': expr(`${job}.mime`) }),
  sendBody: true, contentType: 'binaryData', inputDataFieldName: 'data', options: { timeout: 120000 },
}, [3740, 240]);
http('Vérifier le résultat Drive', 'google', { url: googleFile, sendQuery: true, queryParameters: params({ fields, supportsAllDrives: 'true' }) }, [3960, 240]);
condition('Empreinte et dossier conformes', verified("$('Vérifier le résultat Drive').item.json"), [4180, 240]);
node('Résultat vérifié', 'set', 3.5, { mode: 'raw', jsonOutput: expr('{ driveFile: $json }'), options: {} }, [4400, 0]);
http('Confirmer la réception dans ComÉternel', 'app', {
  method: 'POST', url: jobApi('/result'), ...jsonBody(`{ leaseId: ${job}.leaseId, status: 'succeeded', driveFile: $('Résultat vérifié').item.json.driveFile }`),
}, [4620, 0], { failure: 'Retour application à reprendre' });
node('Transfert confirmé', 'noOp', 1, {}, [4840, 0]);
node('Retour application à reprendre', 'stopAndError', 1, { errorMessage: 'Le fichier a été vérifié dans Drive, mais le retour à ComÉternel a échoué. Reprendre le même transfert ; ne pas créer un autre fichier.' }, [4840, 240]);
http('Signaler un échec', 'app', {
  method: 'POST', url: jobApi('/result'), ...jsonBody(`{ leaseId: ${job}.leaseId, status: 'failed', errorCode: 'transfer_failed' }`),
}, [3300, 560], { failure: 'Échec non confirmé' });
node('Transfert interrompu', 'stopAndError', 1, { errorMessage: 'Transfert interrompu et signalé à ComÉternel. Les fichiers existants et l’original local sont conservés. Vérifier le nœud en erreur avant de reprendre.' }, [3520, 560]);
node('Échec non confirmé', 'stopAndError', 1, { errorMessage: 'Transfert interrompu ; ComÉternel ne confirme pas le signalement. Vérifier le test après expiration du verrou avant de reprendre.' }, [3520, 780]);

link('Lancer un seul test', 'Configuration du test');
link('Configuration du test', 'Configuration confirmée');
link('Configuration confirmée', 'Réserver un transfert'); link('Configuration confirmée', 'Configuration requise', 1);
link('Réserver un transfert', 'Un transfert disponible');
link('Un transfert disponible', 'Contrat du fichier valide'); link('Un transfert disponible', 'Aucun transfert en attente', 1);
link('Contrat du fichier valide', 'Identifiant déjà réservé'); link('Contrat du fichier valide', 'Signaler un échec', 1);
link('Identifiant déjà réservé', 'Identifiant Drive retenu'); link('Identifiant déjà réservé', 'Générer un identifiant Drive', 1);
link('Générer un identifiant Drive', 'Conserver l’identifiant dans ComÉternel');
link('Conserver l’identifiant dans ComÉternel', 'Identifiant Drive retenu');
link('Identifiant Drive retenu', 'Lire le fichier existant'); link('Lire le fichier existant', 'Fichier déjà présent');
link('Fichier déjà présent', 'Métadonnées avant transfert'); link('Fichier déjà présent', 'Fichier absent', 1);
link('Fichier absent', 'Créer le fichier vide réservé'); link('Fichier absent', 'Signaler un échec', 1);
link('Créer le fichier vide réservé', 'Création ou conflit récupérable');
link('Création ou conflit récupérable', 'Relire après création'); link('Création ou conflit récupérable', 'Signaler un échec', 1);
link('Relire après création', 'Métadonnées avant transfert');
link('Métadonnées avant transfert', 'Fichier déjà vérifié');
link('Fichier déjà vérifié', 'Résultat vérifié'); link('Fichier déjà vérifié', 'Fichier vide du même transfert', 1);
link('Fichier vide du même transfert', 'Télécharger le fichier privé'); link('Fichier vide du même transfert', 'Signaler un échec', 1);
link('Télécharger le fichier privé', 'Écrire le contenu dans Drive');
link('Écrire le contenu dans Drive', 'Vérifier le résultat Drive');
link('Vérifier le résultat Drive', 'Empreinte et dossier conformes');
link('Empreinte et dossier conformes', 'Résultat vérifié'); link('Empreinte et dossier conformes', 'Signaler un échec', 1);
link('Résultat vérifié', 'Confirmer la réception dans ComÉternel'); link('Confirmer la réception dans ComÉternel', 'Transfert confirmé');
link('Signaler un échec', 'Transfert interrompu');

const workflow = {
  name: 'ComÉternel · Tester un transfert Drive', active: false,
  nodes, connections, pinData: {},
  settings: { executionOrder: 'v1', timezone: 'America/Martinique', executionTimeout: 600, saveDataSuccessExecution: 'none', saveDataErrorExecution: 'none', saveManualExecutions: false, saveExecutionProgress: false },
  tags: [],
};
await writeFile(path.join(dir, 'cometernel-drive-test.json'), `${JSON.stringify(workflow, null, 2)}\n`);

// Offline template: rename only inside the workflowsPath returned by n8nac env status.
// .template keeps this independent automation outside the Next.js TypeScript build.
const properties = new Map(nodes.map((n, i) => [n.name, `Node${String(i + 1).padStart(2, '0')}`]));
let ts = `// <workflow-map>\n// Workflow: ${workflow.name}\n// Manual test, inactive; 1 job maximum; no credentials embedded.\n`;
for (const n of nodes) ts += `// ${properties.get(n.name)}: ${n.name} (${n.type})\n`;
ts += `// </workflow-map>\nimport { workflow, node, links } from '@n8n-as-code/transformer';\n\n@workflow(${JSON.stringify({ name: workflow.name, active: false, settings: workflow.settings }, null, 2)})\nexport class CometernelDriveTest {\n`;
for (const { parameters, typeVersion, ...meta } of nodes) {
  ts += `\n  @node(${JSON.stringify({ ...meta, version: typeVersion }, null, 2)})\n  ${properties.get(meta.name)} = ${JSON.stringify(parameters, null, 2)};\n`;
}
ts += '\n  @links()\n  defineRouting() {\n';
for (const [source, outs] of Object.entries(connections)) outs.main.forEach((targets, index) => targets.forEach((target) => { ts += `    this.${properties.get(source)}.out(${index}).to(this.${properties.get(target.node)}.in(${target.index}));\n`; }));
ts += '  }\n}\n';
await writeFile(path.join(dir, 'cometernel-drive-test.workflow.ts.template'), ts);
console.log(`Built inactive offline draft: ${nodes.length} nodes, ${Object.values(connections).reduce((sum, n) => sum + n.main.flat().length, 0)} connections.`);
