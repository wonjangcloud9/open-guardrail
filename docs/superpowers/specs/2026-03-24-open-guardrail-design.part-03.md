## Type Definitions

```typescript
// --- Guard Interface ---

interface Guard {
  name: string;
  version: string;                          // semver
  description: string;
  category: GuardCategory;
  tags?: string[];
  supportedStages: ('input' | 'output')[];
  check(text: string, ctx: GuardContext): Promise<GuardResult>;
  init?(): Promise<void>;                   // 리소스 초기화
  dispose?(): Promise<void>;                // 정리
}

type GuardCategory =
  | 'security' | 'privacy' | 'content'
  | 'format' | 'ai' | 'locale' | 'custom';

// 가드 팩토리 패턴 (사용자가 옵션 전달)
type GuardFactory<T = unknown> = (options: T) => Guard;

// --- Context ---

interface GuardContext {
  pipelineType: 'input' | 'output';        // 엔진이 주입
  previousResults?: GuardResult[];
  metadata?: Record<string, any>;           // 사용자 커스텀
  signal?: AbortSignal;                     // 취소 지원
  dryRun?: boolean;
}

// --- Results ---

interface GuardResult {
  guardName: string;
  passed: boolean;
  action: 'allow' | 'block' | 'warn' | 'override';
  score?: number;           // 0.0~1.0 (1.0 = 위반 확신)
  message?: string;
  overrideText?: string;    // action='override' 시 대체 텍스트
  details?: Record<string, any>;
  latencyMs: number;
  error?: GuardError;
}

interface GuardError {
  code: 'TIMEOUT' | 'EXCEPTION' | 'NETWORK' | 'INVALID_CONFIG';
  message: string;
  cause?: Error;
}

interface PipelineResult {
  passed: boolean;
  action: 'allow' | 'block' | 'warn' | 'override';
  results: GuardResult[];
  input: string;
  output?: string;          // mask/override 변환된 텍스트
  totalLatencyMs: number;
  metadata: {
    pipelineType: 'input' | 'output';
    mode: 'fail-fast' | 'run-all';
    dryRun: boolean;
    timestamp: string;
  };
}

// --- Pipeline ---

interface PipelineOptions {
  type?: 'input' | 'output';  // default: 'input'
  mode?: 'fail-fast' | 'run-all'; // default: 'fail-fast'
  onError?: 'block' | 'allow' | 'warn'; // default: 'block'
  timeoutMs?: number;          // default: 5000
  dryRun?: boolean;            // default: false
  guards: Guard[];
}

// pipe()는 createPipeline의 축약형
function pipe(...guards: Guard[]): Pipeline;
function createPipeline(options: PipelineOptions): Pipeline;
```

## Streaming Support

v1.0에서는 완성된 텍스트만 지원.
스트리밍은 Phase 3에서 검토 예정:
- 청크 단위 가드 (실시간 필터링)
- 완료 후 전체 텍스트 가드 (후처리)
