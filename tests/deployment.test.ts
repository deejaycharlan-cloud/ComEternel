import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mailConfig, validatePublicDeployment } from '../src/config/deployment';
const valid = {
  COMETERNEL_DEPLOYMENT: 'public', BETTER_AUTH_URL: 'https://cometernel.example.org', BETTER_AUTH_SECRET: 'x'.repeat(48),
  AUTH_MAIL_MODE: 'smtp', SMTP_HOST: 'smtp.example.org', SMTP_USER: 'user', SMTP_PASSWORD: 'private-password', SMTP_FROM: 'connexion@example.org',
  STORAGE_DRIVER: 's3', S3_BUCKET: 'private', S3_REGION: 'eu-west-3',
};
test('production refuse email local, origine HTTP, stockage local et secret manquant', () => {
  assert.doesNotThrow(() => validatePublicDeployment(valid));
  for (const change of [{ AUTH_MAIL_MODE: 'local' }, { BETTER_AUTH_URL: 'http://localhost:3100' }, { STORAGE_DRIVER: 'local' }, { BETTER_AUTH_SECRET: '' }, { S3_ENDPOINT: 'http://s3.example.org' }, { SMTP_PASSWORD: '' }]) {
    assert.throws(() => validatePublicDeployment({ ...valid, ...change }), error => error instanceof Error && !error.message.includes('private-password'));
  }
});
test('SMTP distant impose TLS et interdit ports arbitraires et injection expéditeur', () => {
  assert.equal(mailConfig(valid).requireTLS, true);
  assert.equal(mailConfig({ ...valid, SMTP_PORT: '465' }).secure, true);
  assert.throws(() => mailConfig({ ...valid, SMTP_PORT: '25' }));
  assert.throws(() => mailConfig({ ...valid, SMTP_FROM: 'user@example.org\r\nBcc: other@example.org' }));
  assert.throws(() => mailConfig({ AUTH_MAIL_MODE: 'local', BETTER_AUTH_URL: 'https://example.org' }));
  assert.equal(mailConfig({ AUTH_MAIL_MODE: 'local' }).local, true);
});
