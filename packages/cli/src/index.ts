import { runInit } from './commands/init.js';
import { runValidate } from './commands/validate.js';
import { runList } from './commands/list.js';
import { runTest } from './commands/test.js';

const [,, command, ...args] = process.argv;

function parseFlag(flag: string): string | undefined {
  const match = args.find((a) => a.startsWith(`--${flag}=`));
  return match?.split('=')[1];
}

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
    case 'list': {
      const category = parseFlag('category') ?? args[0];
      const language = parseFlag('language');
      const format = parseFlag('format') as 'table' | 'json' | undefined;
      runList({ category, language, format });
      break;
    }
    case 'test': {
      const configFile = args[0] ?? 'guardrail.yaml';
      const testFile = args[1];
      const { passed, failed, results } = await runTest(configFile, testFile);
      for (const r of results) {
        const icon = r.passed ? '\u2713' : '\u2717';
        console.log(`  ${icon} ${r.label.padEnd(30)} ${r.action.padEnd(8)} ${r.latencyMs}ms`);
      }
      console.log(`\n  ${passed} passed, ${failed} failed`);
      if (failed > 0) process.exit(1);
      break;
    }
    default:
      console.log('Usage: open-guardrail <command> [args]');
      console.log('');
      console.log('Commands:');
      console.log('  init [preset]              Create guardrail.yaml');
      console.log('  validate [file]            Validate a config file');
      console.log('  list [category]            List available guards');
      console.log('    --language=ko            Filter by language');
      console.log('    --format=json            Output as JSON');
      console.log('  test [config] [testfile]   Test guards against sample inputs');
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
