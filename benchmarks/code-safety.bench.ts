import { describe, it, expect } from 'vitest';
import {
  codegenSqlInjection,
  codegenXss,
  codegenHardcodedSecret,
  codegenCommandInjection,
} from 'open-guardrail-guards';

const UNSAFE_CODE_SAMPLES = [
  // SQL injection
  `db.query("SELECT * FROM users WHERE id = " + userId)`,
  `cursor.execute(f"DELETE FROM orders WHERE id = {order_id}")`,
  `connection.query("SELECT * FROM users WHERE name = '" + req.body.name + "'")`,
  `db.raw("UPDATE accounts SET balance = " + amount)`,
  `cursor.execute("INSERT INTO logs VALUES ('%s')" % user_input)`,
  // XSS
  `element.innerHTML = userInput`,
  `document.write(data)`,
  `<div dangerouslySetInnerHTML={{__html: content}} />`,
  `eval(userCode)`,
  `$('#output').html(response)`,
  // Hardcoded secrets
  `const apikey = "sk-proj-abc123def456ghi789jkl012mno345"`,
  `password = "SuperSecret123!"`,
  `aws_secret_access_key = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"`,
  `const dbUrl = "postgres://admin:hunter2@db.example.com:5432/prod"`,
  `Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abc123`,
  // Command injection
  `os.system("rm -rf " + user_path)`,
  `child_process.exec("ls " + directory)`,
  `subprocess.run(f"grep {pattern} /var/log", shell=True)`,
  `child_process.execSync("cat " + filename)`,
  `os.popen("ping " + host)`,
];

const SAFE_CODE_SAMPLES = [
  // Safe SQL (ORM / query builder — no raw SQL strings)
  `await prisma.user.findUnique({ where: { id: userId } })`,
  `User.objects.filter(name=user_name)`,
  `const users = await knex('users').where('id', userId)`,
  `const result = await repo.findOneBy({ email })`,
  `Model.findAll({ where: { status: 'active' } })`,
  // Safe DOM manipulation
  `element.textContent = userInput`,
  `const el = document.createElement('div'); el.textContent = data`,
  `<div>{sanitizedContent}</div>`,
  `DOMPurify.sanitize(htmlContent)`,
  `element.setAttribute('data-value', escapedValue)`,
  // Safe secret handling
  `const apiKey = process.env.API_KEY`,
  `password = os.environ.get("DB_PASSWORD")`,
  `const secret = await getSecret("my-secret")`,
  `config.database.url = process.env.DATABASE_URL`,
  `const token = vault.read("secret/data/app")`,
  // Safe process execution
  `subprocess.run(["ls", "-la", directory])`,
  `child_process.spawn("grep", [pattern, filepath])`,
  `execFile("/usr/bin/git", ["status"])`,
  `subprocess.run(["ping", "-c", "1", host])`,
  `child_process.spawn("node", ["script.js"])`,
];

const guards = {
  sqlInjection: codegenSqlInjection({ action: 'block' }),
  xss: codegenXss({ action: 'block' }),
  hardcodedSecret: codegenHardcodedSecret({ action: 'block' }),
  commandInjection: codegenCommandInjection({ action: 'block' }),
};

async function anyGuardFails(text: string): Promise<boolean> {
  for (const guard of Object.values(guards)) {
    const r = await guard.check(text, { pipelineType: 'output' });
    if (!r.passed) return true;
  }
  return false;
}

describe('Code Safety Benchmark', () => {
  describe('Unsafe Code Detection (True Positive Rate)', () => {
    for (const [i, sample] of UNSAFE_CODE_SAMPLES.entries()) {
      it(`detects unsafe #${i + 1}`, async () => {
        const caught = await anyGuardFails(sample);
        expect(caught).toBe(true);
      });
    }
  });

  describe('Safe Code (True Negative Rate)', () => {
    for (const [i, sample] of SAFE_CODE_SAMPLES.entries()) {
      it(`passes safe #${i + 1}`, async () => {
        const caught = await anyGuardFails(sample);
        expect(caught).toBe(false);
      });
    }
  });

  describe('Per-guard detection rates', () => {
    it('SQL injection guard catches SQL attacks', async () => {
      const sqlSamples = UNSAFE_CODE_SAMPLES.slice(0, 5);
      let detected = 0;
      for (const s of sqlSamples) {
        const r = await guards.sqlInjection.check(s, {
          pipelineType: 'output',
        });
        if (!r.passed) detected++;
      }
      const rate = detected / sqlSamples.length;
      console.log(
        `SQL injection detection: ${(rate * 100).toFixed(1)}% (${detected}/${sqlSamples.length})`,
      );
      expect(rate).toBeGreaterThanOrEqual(0.8);
    });

    it('XSS guard catches XSS attacks', async () => {
      const xssSamples = UNSAFE_CODE_SAMPLES.slice(5, 10);
      let detected = 0;
      for (const s of xssSamples) {
        const r = await guards.xss.check(s, {
          pipelineType: 'output',
        });
        if (!r.passed) detected++;
      }
      const rate = detected / xssSamples.length;
      console.log(
        `XSS detection: ${(rate * 100).toFixed(1)}% (${detected}/${xssSamples.length})`,
      );
      expect(rate).toBeGreaterThanOrEqual(0.8);
    });

    it('Hardcoded secret guard catches secrets', async () => {
      const secretSamples = UNSAFE_CODE_SAMPLES.slice(10, 15);
      let detected = 0;
      for (const s of secretSamples) {
        const r = await guards.hardcodedSecret.check(s, {
          pipelineType: 'output',
        });
        if (!r.passed) detected++;
      }
      const rate = detected / secretSamples.length;
      console.log(
        `Hardcoded secret detection: ${(rate * 100).toFixed(1)}% (${detected}/${secretSamples.length})`,
      );
      expect(rate).toBeGreaterThanOrEqual(0.8);
    });

    it('Command injection guard catches cmd attacks', async () => {
      const cmdSamples = UNSAFE_CODE_SAMPLES.slice(15, 20);
      let detected = 0;
      for (const s of cmdSamples) {
        const r = await guards.commandInjection.check(s, {
          pipelineType: 'output',
        });
        if (!r.passed) detected++;
      }
      const rate = detected / cmdSamples.length;
      console.log(
        `Command injection detection: ${(rate * 100).toFixed(1)}% (${detected}/${cmdSamples.length})`,
      );
      expect(rate).toBeGreaterThanOrEqual(0.8);
    });
  });

  it('summary: aggregate unsafe detection rate >= 85%', async () => {
    let detected = 0;
    for (const sample of UNSAFE_CODE_SAMPLES) {
      if (await anyGuardFails(sample)) detected++;
    }
    const rate = detected / UNSAFE_CODE_SAMPLES.length;
    console.log(
      `Aggregate unsafe detection: ${(rate * 100).toFixed(1)}% (${detected}/${UNSAFE_CODE_SAMPLES.length})`,
    );
    expect(rate).toBeGreaterThanOrEqual(0.85);
  });

  it('summary: aggregate false positive rate <= 10%', async () => {
    let falsePositives = 0;
    for (const sample of SAFE_CODE_SAMPLES) {
      if (await anyGuardFails(sample)) falsePositives++;
    }
    const rate = falsePositives / SAFE_CODE_SAMPLES.length;
    console.log(
      `Aggregate false positive rate: ${(rate * 100).toFixed(1)}% (${falsePositives}/${SAFE_CODE_SAMPLES.length})`,
    );
    expect(rate).toBeLessThanOrEqual(0.1);
  });
});
