# open-guardrail-cli

[![npm](https://img.shields.io/npm/v/open-guardrail-cli)](https://www.npmjs.com/package/open-guardrail-cli) [![CI](https://github.com/wonjangcloud9/open-guardrail/actions/workflows/ci.yaml/badge.svg)](https://github.com/wonjangcloud9/open-guardrail/actions)

CLI for [open-guardrail](https://github.com/wonjangcloud9/open-guardrail) — init projects and validate guardrail configs.

[![npm](https://img.shields.io/npm/v/open-guardrail-cli)](https://www.npmjs.com/package/open-guardrail-cli)

## Install

```bash
npm install -g open-guardrail-cli
```

## Commands

### `init`

Create a `guardrail.yaml` config file with a preset:

```bash
open-guardrail init              # default preset
open-guardrail init strict       # strict preset
```

Available presets: `default`, `strict`

### `validate`

Validate a guardrail config file:

```bash
open-guardrail validate                    # validates ./guardrail.yaml
open-guardrail validate ./custom.yaml      # validates specific file
```

## License

MIT
