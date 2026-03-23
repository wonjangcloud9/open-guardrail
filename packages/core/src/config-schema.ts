import { z } from 'zod';

const guardActionSchema = z.enum(['allow', 'block', 'warn', 'override', 'mask']);
const pipelineModeSchema = z.enum(['fail-fast', 'run-all']);
const onErrorSchema = z.enum(['block', 'allow', 'warn']);

const guardConfigSchema = z.object({
  type: z.string().min(1),
  action: guardActionSchema,
  threshold: z.number().min(0).max(1).optional(),
  config: z.record(z.unknown()).optional(),
});

const pipelineConfigSchema = z.object({
  mode: pipelineModeSchema.default('fail-fast'),
  onError: onErrorSchema.default('block'),
  timeoutMs: z.number().positive().default(5000),
  guards: z.array(guardConfigSchema).min(1),
});

export const configSchema = z.object({
  version: z.literal('1'),
  pipelines: z.object({
    input: pipelineConfigSchema.optional(),
    output: pipelineConfigSchema.optional(),
  }).refine(
    (p) => p.input || p.output,
    { message: 'At least one pipeline (input or output) is required' },
  ),
});

export type RawConfig = z.infer<typeof configSchema>;
export type RawGuardConfig = z.infer<typeof guardConfigSchema>;
export type RawPipelineConfig = z.infer<typeof pipelineConfigSchema>;
