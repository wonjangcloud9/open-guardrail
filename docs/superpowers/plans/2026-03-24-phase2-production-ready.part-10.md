## Task 9: Update pnpm-workspace + README + final build

**Files:**
- Modify: `pnpm-workspace.yaml` (add examples)
- Modify: `README.md`

- [ ] **Step 1: Update pnpm-workspace.yaml**

```yaml
packages:
  - "packages/*"
  - "examples/*"
```

- [ ] **Step 2: Update README.md**

Update the README with more complete information:
- Add Node.js compatibility note (>= 18)
- Add link to CONTRIBUTING.md
- Add link to SECURITY.md
- Update package table with better descriptions
- Add "Examples" section linking to examples/

Key additions after Features section:

```markdown
## Examples

| Example | Description |
|---------|-------------|
| [basic-usage](./examples/basic-usage/) | `pipe()` with prompt-injection, PII masking, keyword blocking |
| [yaml-config](./examples/yaml-config/) | Config-driven guardrail with `guardrail.yaml` |
| [custom-guard](./examples/custom-guard/) | Creating a custom guard implementing Guard interface |
| [with-express](./examples/with-express/) | Express middleware integration |
| [with-nextjs](./examples/with-nextjs/) | Next.js App Router API route |
| [korean-compliance](./examples/korean-compliance/) | 한국 규제 준수 (ISMS-P, PIPA) |

## Presets

| Preset | Use Case |
|--------|----------|
| `default` | Basic protection (prompt-injection, keyword, word-count) |
| `strict` | Full PII masking + strict blocking |
| `korean` | Korean compliance (ISMS-P, PIPA, 주민등록번호) |
| `security` | Injection, PII, data leakage focused |
| `content` | Toxicity, bias, language control |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and guidelines.

## Security

See [SECURITY.md](./SECURITY.md) for vulnerability reporting.
```

- [ ] **Step 3: Run full build + test**

Run: `pnpm install && pnpm build && pnpm test`
Expected: all packages build, all tests PASS

- [ ] **Step 4: Commit**

```bash
git add pnpm-workspace.yaml README.md
git commit -m "docs: update README with examples, presets, contributing links"
```

## Task 10: Version bump + tag

**Files:**
- All package.json files (verify v0.5.0)

- [ ] **Step 1: Verify all versions are 0.5.0**

Run: `grep -r '"version"' packages/*/package.json`
Expected: all show "0.5.0"

- [ ] **Step 2: Update dependency ranges**

In `packages/open-guardrail/package.json`, update:
```json
{
  "dependencies": {
    "open-guardrail-core": "^0.5.0",
    "open-guardrail-guards": "^0.5.0"
  }
}
```

- [ ] **Step 3: Final full build + test**

Run: `pnpm install && pnpm build && pnpm test`
Expected: all PASS

- [ ] **Step 4: Commit + tag**

```bash
git add .
git commit -m "chore: bump all packages to v0.5.0 — Phase 2 Production-Ready"
git tag v0.5.0
```

Phase 2 complete. Ready for npm publish with `pnpm -r publish --access public`.
