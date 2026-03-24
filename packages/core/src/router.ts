import type { PipelineResult } from './types.js';
import { Pipeline } from './pipeline.js';

type RiskLevel = string;
type Classifier = (text: string) => RiskLevel;

interface RouterOptions {
  classifier: Classifier;
  routes: Record<RiskLevel, Pipeline>;
  defaultRoute?: Pipeline;
}

export class GuardRouter {
  private classifier: Classifier;
  private routes: Record<RiskLevel, Pipeline>;
  private defaultRoute?: Pipeline;

  constructor(options: RouterOptions) {
    this.classifier = options.classifier;
    this.routes = options.routes;
    this.defaultRoute = options.defaultRoute;
  }

  async run(text: string, metadata?: Record<string, unknown>): Promise<PipelineResult> {
    const level = this.classifier(text);
    const pipeline = this.routes[level] ?? this.defaultRoute;

    if (!pipeline) {
      throw new Error(`No route for risk level "${level}" and no default route configured`);
    }

    const result = await pipeline.run(text, metadata);
    return {
      ...result,
      metadata: { ...result.metadata, riskLevel: level },
    };
  }
}

export function createRouter(options: RouterOptions): GuardRouter {
  return new GuardRouter(options);
}
