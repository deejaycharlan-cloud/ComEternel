import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const workflow = JSON.parse(await readFile(new URL('./cometernel-drive-test.json', import.meta.url), 'utf8'));
const nodes = new Map(workflow.nodes.map((node) => [node.name, node]));
const job = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', leaseId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', mediaId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', folderId: 'test-folder-id-only', driveFileId: 'test-reserved-file-id', name: 'fixture.png', mime: 'image/png', size: 68, sha256: 'a'.repeat(64) };
const expectedFile = { id: job.driveFileId, name: job.name, mimeType: job.mime, size: '68', sha256Checksum: job.sha256, parents: [job.folderId], trashed: false, appProperties: { cometernelJob: job.id } };

function evaluate(expression, fixture = {}) {
  assert.ok(expression.startsWith('={{ ') && expression.endsWith(' }}'));
  const named = {
    'Réserver un transfert': { job },
    'Identifiant Drive retenu': { driveFileId: job.driveFileId },
    'Configuration du test': { appBaseUrl: 'https://cometernel.example', testEnabled: true },
    'Métadonnées avant transfert': expectedFile,
    'Vérifier le résultat Drive': expectedFile,
    ...fixture.named,
  };
  return vm.runInNewContext(`(${expression.slice(4, -3)})`, {
    $json: fixture.current ?? {},
    $execution: { id: 'local-expression-test' },
    $: (name) => { assert.ok(name in named, `Missing fixture ${name}`); return { item: { json: named[name] } }; },
  }, { timeout: 100 });
}
function condition(name, fixture) { return evaluate(nodes.get(name).parameters.conditions.conditions[0].leftValue, fixture); }

test('no automatic trigger, secret or remote destination in the delivered draft', () => {
  assert.equal(workflow.active, false);
  assert.deepEqual(JSON.parse(nodes.get('Configuration du test').parameters.jsonOutput), { appBaseUrl: '', testEnabled: false });
  assert.equal(workflow.nodes.filter(n => /Trigger$/.test(n.type)).length, 1);
  assert.equal(nodes.get('Lancer un seul test').type, 'n8n-nodes-base.manualTrigger');
  for (const n of workflow.nodes) assert.equal('credentials' in n, false);
});

test('all graph edges and expression references exist; network failures have visible exits', () => {
  for (const [source, paths] of Object.entries(workflow.connections)) {
    assert.ok(nodes.has(source));
    for (const edge of paths.main.flat()) assert.ok(nodes.has(edge.node));
  }
  for (const n of workflow.nodes) {
    for (const [, reference] of JSON.stringify(n.parameters).matchAll(/\$\('([^']+)'\)/g)) assert.ok(nodes.has(reference), reference);
    if (n.type !== 'n8n-nodes-base.httpRequest') continue;
    assert.equal(n.onError, 'continueErrorOutput', n.name);
    assert.ok(workflow.connections[n.name].main[1].length > 0, n.name);
    assert.equal(n.parameters.options.redirect.redirect.followRedirects, false);
    assert.equal(n.retryOnFail, true);
    assert.equal(n.parameters.authentication, n.parameters.url.includes('googleapis.com') ? 'predefinedCredentialType' : 'genericCredentialType');
  }
});

test('configuration refuses disabled tests, credentials in URL, paths and unexpected cleartext hosts', () => {
  const check = (appBaseUrl, testEnabled = true) => condition('Configuration confirmée', { named: { 'Configuration du test': { appBaseUrl, testEnabled } } });
  assert.equal(check('https://cometernel.example'), true);
  assert.equal(check('http://localhost:3101'), true);
  assert.equal(check('http://host.docker.internal:3101'), true);
  assert.equal(check('https://cometernel.example', false), false);
  assert.equal(check('https://user:secret@cometernel.example'), false);
  assert.equal(check('https://cometernel.example/arbitrary/path'), false);
  assert.equal(check('http://external.example'), false);
  assert.equal(check(''), false);
});

test('file contract requires bounded known binary data and durable identity', () => {
  const check = (override) => condition('Contrat du fichier valide', { named: { 'Réserver un transfert': { job: { ...job, ...override } } } });
  assert.equal(check({}), true);
  assert.equal(check({ driveFileId: null }), true);
  for (const override of [{ size: 0 }, { size: 5242881 }, { size: '68' }, { sha256: 'wrong' }, { mime: 'application/vnd.google-apps.document' }, { folderId: '../folder' }, { leaseId: '' }, { name: '' }]) assert.equal(check(override), false);
});

test('an existing verified file finishes without a second upload', () => {
  assert.equal(condition('Fichier déjà vérifié'), true);
  assert.equal(condition('Fichier vide du même transfert'), false);
  assert.equal(workflow.connections['Fichier déjà vérifié'].main[0][0].node, 'Résultat vérifié');
  for (const override of [{ size: '69' }, { sha256Checksum: 'b'.repeat(64) }, { parents: ['different-folder'] }, { parents: [job.folderId, 'other-folder'] }, { appProperties: { cometernelJob: 'other-job' } }, { mimeType: 'application/pdf' }, { trashed: true }, { sha256Checksum: undefined }]) {
    assert.equal(condition('Fichier déjà vérifié', { named: { 'Métadonnées avant transfert': { ...expectedFile, ...override } } }), false);
    assert.equal(condition('Empreinte et dossier conformes', { named: { 'Vérifier le résultat Drive': { ...expectedFile, ...override } } }), false);
  }
});

test('only the empty file of this job may receive bytes; altered existing files are preserved', () => {
  const check = (override) => condition('Fichier vide du même transfert', { named: { 'Métadonnées avant transfert': { ...expectedFile, size: '0', sha256Checksum: undefined, ...override } } });
  assert.equal(check({}), true);
  assert.equal(check({ size: '69', sha256Checksum: 'b'.repeat(64) }), false);
  assert.equal(check({ parents: ['different-folder'] }), false);
  assert.equal(check({ appProperties: { cometernelJob: 'other-job' } }), false);
  assert.equal(check({ trashed: true }), false);
  assert.equal(workflow.connections['Fichier vide du même transfert'].main[1][0].node, 'Signaler un échec');
});

test('binary download is directly connected to upload; result contains observed metadata', () => {
  const download = nodes.get('Télécharger le fichier privé');
  const upload = nodes.get('Écrire le contenu dans Drive');
  assert.equal(download.parameters.options.response.response.responseFormat, 'file');
  assert.equal(download.parameters.options.response.response.outputPropertyName, 'data');
  assert.equal(upload.parameters.contentType, 'binaryData');
  assert.equal(upload.parameters.inputDataFieldName, 'data');
  assert.equal(workflow.connections[download.name].main[0][0].node, upload.name);
  const callback = evaluate(nodes.get('Confirmer la réception dans ComÉternel').parameters.jsonBody, { named: { 'Résultat vérifié': { driveFile: expectedFile } } });
  assert.equal(callback.status, 'succeeded');
  assert.equal(callback.leaseId, job.leaseId);
  assert.equal(callback.driveFile.sha256Checksum, expectedFile.sha256Checksum);
  assert.equal(callback.driveFile.id, expectedFile.id);
});

test('claim retries use a request identity and reservation precedes any Drive creation', () => {
  assert.equal(evaluate(nodes.get('Réserver un transfert').parameters.jsonBody).requestId, 'local-expression-test');
  assert.equal(workflow.connections['Générer un identifiant Drive'].main[0][0].node, 'Conserver l’identifiant dans ComÉternel');
  assert.equal(workflow.connections['Conserver l’identifiant dans ComÉternel'].main[0][0].node, 'Identifiant Drive retenu');
  assert.equal(nodes.get('Créer le fichier vide réservé').parameters.jsonBody.includes('Identifiant Drive retenu'), true);
});
