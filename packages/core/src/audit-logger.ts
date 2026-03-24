import type { GuardAction } from './types.js';

export interface AuditEntry {
  timestamp: string;
  event: string;
  guardName: string;
  action: GuardAction | string;
  passed: boolean;
  inputPreview: string;
  score?: number;
  metadata?: Record<string, unknown>;
}

interface AuditRecordInput {
  event: string;
  guardName: string;
  action: GuardAction | string;
  passed: boolean;
  inputPreview: string;
  score?: number;
  metadata?: Record<string, unknown>;
}

interface AuditLoggerOptions {
  maxPreviewLength?: number;
  maxEntries?: number;
}

interface QueryOptions {
  from?: Date;
  to?: Date;
  guardName?: string;
  action?: string;
  passed?: boolean;
}

export class AuditLogger {
  private _entries: AuditEntry[] = [];
  private maxPreviewLength: number;
  private maxEntries: number;

  constructor(options?: AuditLoggerOptions) {
    this.maxPreviewLength = options?.maxPreviewLength ?? 200;
    this.maxEntries = options?.maxEntries ?? 10000;
  }

  get entries(): readonly AuditEntry[] {
    return this._entries;
  }

  record(input: AuditRecordInput): void {
    const preview = input.inputPreview.length > this.maxPreviewLength
      ? input.inputPreview.slice(0, this.maxPreviewLength) + '...'
      : input.inputPreview;

    this._entries.push({
      timestamp: new Date().toISOString(),
      event: input.event,
      guardName: input.guardName,
      action: input.action,
      passed: input.passed,
      inputPreview: preview,
      score: input.score,
      metadata: input.metadata,
    });

    if (this._entries.length > this.maxEntries) {
      this._entries = this._entries.slice(-this.maxEntries);
    }
  }

  query(options: QueryOptions): AuditEntry[] {
    return this._entries.filter((e) => {
      if (options.from && new Date(e.timestamp) < options.from) return false;
      if (options.to && new Date(e.timestamp) > options.to) return false;
      if (options.guardName && e.guardName !== options.guardName) return false;
      if (options.action && e.action !== options.action) return false;
      if (options.passed !== undefined && e.passed !== options.passed) return false;
      return true;
    });
  }

  exportJSON(): string {
    return JSON.stringify(this._entries, null, 2);
  }

  createHandler(): (payload: Record<string, unknown>) => Promise<void> {
    return async (payload) => {
      const result = payload.result as Record<string, unknown> | undefined;
      this.record({
        event: result?.action === 'block' ? 'guard:blocked' : 'guard:after',
        guardName: (payload.guardName as string) ?? 'unknown',
        action: (result?.action as string) ?? 'allow',
        passed: (result?.passed as boolean) ?? true,
        inputPreview: (payload.text as string) ?? '',
        score: result?.score as number | undefined,
      });
    };
  }

  clear(): void {
    this._entries = [];
  }
}
