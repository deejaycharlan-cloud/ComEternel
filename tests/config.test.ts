import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readConfig } from '../src/config/env';
import { organizationInput } from '../src/modules/organizations/validation';
test('configuration invalide : aucun secret dans le message', () => {
  for (const value of [undefined, 'https://user:secret@example.com', 'secret']) {
    assert.throws(() => readConfig({ DATABASE_URL: value }), error => error instanceof Error && !error.message.includes('secret'));
  }
});
test('fuseau explicitement choisi et nom nettoyé', () => {
  assert.equal(organizationInput.parse({ name: '  Association test  ', timezone: 'America/Martinique' }).name, 'Association test');
  for (const data of [{ name: ' ', timezone: 'UTC' }, { name: 'Valide', timezone: '' }, { name: 'Valide', timezone: 'Mars/Base' }]) assert.equal(organizationInput.safeParse(data).success, false);
});
