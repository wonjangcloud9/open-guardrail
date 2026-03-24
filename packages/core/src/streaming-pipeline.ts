import type {
  Guard, GuardAction, GuardContext, GuardResult,
  PipelineResult, PipelineMode, OnErrorAction, PipelineStage,
} from './types.js';
import { GuardError } from './errors.js';

const ACTION_PRIORITY: Record<GuardAction, number> = { block: 4, override: 3, warn: 2, allow: 1 };

interface StreamingPipelineOptions {
  guards: Guard[];
  type?: PipelineStage;
  mode?: PipelineMode;
  onError?: OnErrorAction;
}

interface StreamOptions {
  onChunk?: (chunk: string) => void;
  metadata?: Record<string, unknown>;
}

export class StreamingPipeline {
  private guards: Guard[];
  private type: PipelineStage;
  private mode: PipelineMode;
  private onError: OnErrorAction;

  constructor(options: StreamingPipelineOptions) {
    this.guards = options.guards;
    this.type = options.type ?? 'output';
    this.mode = options.mode ?? 'fail-fast';
    this.onError = options.onError ?? 'block';
  }

  async runStream(stream: AsyncIterable<string>, options?: StreamOptions): Promise<PipelineResult> {
    const start = performance.now();
    const streamingGuards = this.guards.filter((g) => g.supportsStreaming && g.checkChunk);
    const fullTextGuards = this.guards.filter((g) => !g.supportsStreaming || !g.checkChunk);

    let accumulated = '';
    const chunkResults: GuardResult[] = [];
    let blocked = false;

    for await (const chunk of stream) {
      if (blocked) break;

      const ctx: GuardContext = { pipelineType: this.type, metadata: options?.metadata };

      for (const guard of streamingGuards) {
        try {
          const result = await guard.checkChunk!(chunk, accumulated, ctx);
          if (result.action === 'block') {
            chunkResults.push(result);
            blocked = true;
            if (this.mode === 'fail-fast') break;
          }
        } catch (err) {
          const guardError = err instanceof GuardError ? err : GuardError.fromException(guard.name, err as Error);
          chunkResults.push({
            guardName: guard.name,
            passed: this.onError === 'allow',
            action: this.onError,
            latencyMs: 0,
            error: guardError.toJSON(),
          });
        }
      }

      if (!blocked) {
        options?.onChunk?.(chunk);
      }
      accumulated += chunk;
    }

    // Phase 2: full text guards on accumulated text
    const fullResults: GuardResult[] = [];
    if (!blocked || this.mode === 'run-all') {
      const ctx: GuardContext = { pipelineType: this.type, metadata: options?.metadata };
      for (const guard of fullTextGuards) {
        try {
          const result = await guard.check(accumulated, ctx);
          fullResults.push(result);
          if (result.action === 'block') {
            blocked = true;
            if (this.mode === 'fail-fast') break;
          }
        } catch (err) {
          const guardError = err instanceof GuardError ? err : GuardError.fromException(guard.name, err as Error);
          fullResults.push({
            guardName: guard.name,
            passed: this.onError === 'allow',
            action: this.onError,
            latencyMs: 0,
            error: guardError.toJSON(),
          });
        }
      }
    }

    const allResults = [...chunkResults, ...fullResults];
    const aggregatedAction = this.aggregateAction(allResults);

    return {
      passed: aggregatedAction !== 'block',
      action: aggregatedAction,
      results: allResults,
      input: accumulated,
      totalLatencyMs: Math.round(performance.now() - start),
      metadata: {
        pipelineType: this.type,
        mode: this.mode,
        dryRun: false,
        timestamp: new Date().toISOString(),
      },
    };
  }

  private aggregateAction(results: GuardResult[]): GuardAction {
    if (results.length === 0) return 'allow';
    return results.reduce<GuardAction>((highest, r) =>
      ACTION_PRIORITY[r.action] > ACTION_PRIORITY[highest] ? r.action : highest, 'allow');
  }
}
