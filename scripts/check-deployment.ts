import { readConfig } from '../src/config/env';
import { validatePublicDeployment } from '../src/config/deployment';
try {
  if (process.env.COMETERNEL_DEPLOYMENT !== 'public') throw new Error('COMETERNEL_DEPLOYMENT=public requis.');
  readConfig();
  validatePublicDeployment();
  console.log('Configuration publique cohérente. Les accès distants restent à tester.');
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Configuration publique invalide.');
  process.exitCode = 1;
}
