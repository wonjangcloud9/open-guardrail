## Type Definitions

```typescript
interface GuardResult {
  guardName: string;
  passed: boolean;
  action: 'allow' | 'block' | 'warn' | 'override';
  score?: number;
  message?: string;
  details?: Record<string, any>;
  latencyMs: number;
}

interface PipelineResult {
  passed: boolean;
  action: 'allow' | 'block' | 'warn' | 'override';
  results: GuardResult[];
  input: string;
  output?: string;
  totalLatencyMs: number;
  metadata: {
    pipelineType: 'input' | 'output';
    mode: 'fail-fast' | 'run-all';
    timestamp: string;
  };
}

interface Guard {
  name: string;
  description: string;
  supportedTypes: ('input' | 'output')[];
  check(text: string, ctx: GuardContext): Promise<GuardResult>;
}

interface GuardContext {
  pipelineType: 'input' | 'output';
  config?: Record<string, any>;
  previousResults?: GuardResult[];
  metadata?: Record<string, any>;
}
```
