import 'reflect-metadata';
import { createApp } from './app.js';
import { readConfig } from './config.js';

async function main() {
  let config: ReturnType<typeof readConfig>;
  try {
    config = readConfig(process.env);
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Invalid configuration.');
    process.exitCode = 1;
    return;
  }

  try {
    const app = await createApp(config);
    app.enableShutdownHooks();
    await app.listen(config.port, '0.0.0.0');
    console.log(`Apex API listening on port ${config.port}.`);
  } catch {
    console.error('Apex API startup failed. Check database connectivity, indexes, and the listen port.');
    process.exit(1);
  }
}

void main();
