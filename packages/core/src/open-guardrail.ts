import type { PipelineResult, PipelineStage, Guard } from './types.js';
import { configSchema } from './config-schema.js';
import type { RawConfig } from './config-schema.js';
import { Pipeline } from './pipeline.js';
import { GuardRegistry, type GuardPlugin } from './registry.js';
import { loadConfigFromString } from './config-loader.js';

export class OpenGuardrail {
  private config: RawConfig;
  private registry = new GuardRegistry();
  private pipelines = new Map<PipelineStage, Pipeline>();

  private constructor(config: RawConfig) {
    this.config = config;
  }

  static fromString(yamlOrJson: string): OpenGuardrail {
    const config = loadConfigFromString(yamlOrJson);
    return new OpenGuardrail(config);
  }

  static fromObject(obj: unknown): OpenGuardrail {
    const result = configSchema.safeParse(obj);
    if (!result.success) {
      throw new Error(`Invalid config: ${result.error.issues.map(i => i.message).join(', ')}`);
    }
    return new OpenGuardrail(result.data);
  }

  static async fromConfig(filePath: string): Promise<OpenGuardrail> {
    const { readFileSync } = await import('node:fs');
    const content = readFileSync(filePath, 'utf-8');
    return OpenGuardrail.fromString(content);
  }

  registerGuard(type: string, factory: (config: Record<string, unknown>) => Guard): void {
    this.registry.register(type, factory);
  }

  /** Register a plugin with multiple guards. */
  use(plugin: GuardPlugin): this {
    this.registry.use(plugin);
    return this;
  }

  async run(text: string, stage: PipelineStage = 'input'): Promise<PipelineResult> {
    const pipeline = this.getOrCreatePipeline(stage);
    return pipeline.run(text);
  }

  async dispose(): Promise<void> {
    for (const pipeline of this.pipelines.values()) {
      await pipeline.dispose();
    }
  }

  private getOrCreatePipeline(stage: PipelineStage): Pipeline {
    if (this.pipelines.has(stage)) return this.pipelines.get(stage)!;

    const pipelineConfig = this.config.pipelines[stage];
    if (!pipelineConfig) {
      throw new Error(`Pipeline "${stage}" is not configured`);
    }

    const guards = pipelineConfig.guards.map((g) => this.registry.resolve(g.type, {
      action: g.action,
      threshold: g.threshold,
      ...((g.config as Record<string, unknown>) ?? {}),
    }));

    const pipeline = new Pipeline({
      type: stage,
      mode: pipelineConfig.mode,
      onError: pipelineConfig.onError,
      timeoutMs: pipelineConfig.timeoutMs,
      guards,
    });

    this.pipelines.set(stage, pipeline);
    return pipeline;
  }
}
