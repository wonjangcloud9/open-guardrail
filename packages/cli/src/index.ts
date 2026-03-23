import { runInit } from './commands/init.js';
import { runValidate } from './commands/validate.js';

const [,, command, ...args] = process.argv;

async function main(): Promise<void> {
  switch (command) {
    case 'init': {
      const preset = args[0] ?? 'default';
      await runInit(process.cwd(), preset);
      console.log(`Created guardrail.yaml (${preset} preset)`);
      break;
    }
    case 'validate': {
      const file = args[0] ?? 'guardrail.yaml';
      const result = await runValidate(file);
      if (result.valid) {
        console.log('Config is valid.');
      } else {
        console.error('Config errors:');
        result.errors?.forEach((e) => console.error(`  - ${e}`));
        process.exit(1);
      }
      break;
    }
    default:
      console.log('Usage: open-guardrail <init|validate> [args]');
      console.log('  init [preset]    Create guardrail.yaml (default|strict)');
      console.log('  validate [file]  Validate a config file');
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
