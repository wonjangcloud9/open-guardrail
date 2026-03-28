export type GuardAction = 'allow' | 'block' | 'warn' | 'override';

export type GuardCategory =
  | 'security' | 'privacy' | 'content'
  | 'format' | 'ai' | 'locale' | 'compliance' | 'custom';

export type PipelineStage = 'input' | 'output';

export type PipelineMode = 'fail-fast' | 'run-all';

export type OnErrorAction = 'block' | 'allow' | 'warn';

export interface GuardErrorInfo {
  code: 'TIMEOUT' | 'EXCEPTION' | 'NETWORK' | 'INVALID_CONFIG';
  message: string;
  cause?: Error;
}

export interface GuardResult {
  guardName: string;
  passed: boolean;
  action: GuardAction;
  score?: number;
  message?: string;
  overrideText?: string;
  details?: Record<string, unknown>;
  latencyMs: number;
  error?: GuardErrorInfo;
}

export interface GuardContext {
  pipelineType: PipelineStage;
  previousResults?: GuardResult[];
  metadata?: Record<string, unknown>;
  signal?: AbortSignal;
  dryRun?: boolean;
}

export interface Guard {
  name: string;
  version: string;
  description: string;
  category: GuardCategory;
  tags?: string[];
  supportedStages: PipelineStage[];
  check(text: string, ctx: GuardContext): Promise<GuardResult>;
  checkChunk?(chunk: string, accumulated: string, ctx: GuardContext): Promise<GuardResult>;
  supportsStreaming?: boolean;
  init?(): Promise<void>;
  dispose?(): Promise<void>;
}

export type GuardFactory<T = unknown> = (options: T) => Guard;

export interface PipelineResult {
  passed: boolean;
  action: GuardAction;
  results: GuardResult[];
  input: string;
  output?: string;
  totalLatencyMs: number;
  metadata: {
    pipelineType: PipelineStage;
    mode: PipelineMode;
    dryRun: boolean;
    timestamp: string;
    [key: string]: unknown;
  };
}

export interface PipelineOptions {
  type?: PipelineStage;
  mode?: PipelineMode;
  onError?: OnErrorAction;
  timeoutMs?: number;
  dryRun?: boolean;
  debug?: boolean;
  guards: Guard[];
}
