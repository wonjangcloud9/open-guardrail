import type {
  Guard, GuardAction, GuardContext, GuardResult,
  PipelineOptions, PipelineResult, PipelineMode,
  OnErrorAction, PipelineStage,
} from './types.js';
import { GuardError } from './errors.js';
import { EventBus } from './event-bus.js';

const ACTION_PRIORITY: Record<GuardAction, number> = {
  block: 4,
  override: 3,
  warn: 2,
  allow: 1,
};

export class Pipeline {
  private guards: Guard[];
  private type: PipelineStage;
  private mode: PipelineMode;
  private onError: OnErrorAction;
  private timeoutMs: number;
  private dryRun: boolean;
  private eventBus: EventBus;
  private initialized = false;

  constructor(options: PipelineOptions, eventBus?: EventBus) {
    this.guards = options.guards;
    this.type = options.type ?? 'input';
    this.mode = options.mode ?? 'fail-fast';
    this.onError = options.onError ?? 'block';
    this.timeoutMs = options.timeoutMs ?? 5000;
    this.dryRun = options.dryRun ?? false;
    this.eventBus = eventBus ?? new EventBus();
  }

  on(event: Parameters<EventBus['on']>[0], handler: Parameters<EventBus['on']>[1]): void {
    this.eventBus.on(event, handler);
  }

  async run(text: string, metadata?: Record<string, unknown>): Promise<PipelineResult> {
    const start = performance.now();
    if (!this.initialized) {
      await this.initGuards();
      this.initialized = true;
    }

    const results: GuardResult[] = [];
    let currentText = text;

    for (const guard of this.guards) {
      const ctx: GuardContext = {
        pipelineType: this.type,
        previousResults: [...results],
        metadata,
        dryRun: this.dryRun,
      };

      await this.eventBus.emit('guard:before', { guardName: guard.name, text: currentText });

      const result = await this.executeGuard(guard, currentText, ctx);
      results.push(result);

      await this.eventBus.emit('guard:after', { guardName: guard.name, text: currentText, result });

      if (result.action === 'override' && result.overrideText) {
        currentText = result.overrideText;
      }

      if (result.action === 'block') {
        await this.eventBus.emit('guard:blocked', { guardName: guard.name, text: currentText, result });
        if (this.mode === 'fail-fast' && !this.dryRun) break;
      }
    }

    const aggregatedAction = this.aggregateAction(results);
    const passed = this.dryRun || aggregatedAction !== 'block';

    return {
      passed,
      action: aggregatedAction,
      results,
      input: text,
      output: currentText !== text ? currentText : undefined,
      totalLatencyMs: Math.round(performance.now() - start),
      metadata: {
        pipelineType: this.type,
        mode: this.mode,
        dryRun: this.dryRun,
        timestamp: new Date().toISOString(),
      },
    };
  }

  async dispose(): Promise<void> {
    for (const guard of this.guards) {
      if (guard.dispose) await guard.dispose();
    }
    this.eventBus.removeAll();
  }

  private async initGuards(): Promise<void> {
    for (const guard of this.guards) {
      if (guard.init) await guard.init();
    }
  }

  private async executeGuard(guard: Guard, text: string, ctx: GuardContext): Promise<GuardResult> {
    const start = performance.now();
    try {
      const result = await Promise.race([
        guard.check(text, ctx),
        this.createTimeout(guard.name),
      ]);
      return result;
    } catch (err) {
      const guardError = err instanceof GuardError
        ? err
        : GuardError.fromException(guard.name, err as Error);

      await this.eventBus.emit('guard:error', { guardName: guard.name, error: guardError });

      return {
        guardName: guard.name,
        passed: this.onError === 'allow',
        action: this.onError,
        latencyMs: Math.round(performance.now() - start),
        error: guardError.toJSON(),
        message: guardError.message,
      };
    }
  }

  private createTimeout(guardName: string): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(GuardError.timeout(guardName, this.timeoutMs)), this.timeoutMs);
    });
  }

  private aggregateAction(results: GuardResult[]): GuardAction {
    if (results.length === 0) return 'allow';
    return results.reduce<GuardAction>((highest, r) => {
      return ACTION_PRIORITY[r.action] > ACTION_PRIORITY[highest] ? r.action : highest;
    }, 'allow');
  }
}

export function createPipeline(options: PipelineOptions, eventBus?: EventBus): Pipeline {
  return new Pipeline(options, eventBus);
}

export function pipe(...guards: Guard[]): Pipeline {
  return createPipeline({ guards });
}
