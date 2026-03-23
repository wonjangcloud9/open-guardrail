import type { GuardErrorInfo } from './types.js';

export class GuardError extends Error implements GuardErrorInfo {
  readonly code: GuardErrorInfo['code'];
  readonly cause?: Error;

  constructor(code: GuardErrorInfo['code'], message: string, cause?: Error) {
    super(message);
    this.name = 'GuardError';
    this.code = code;
    this.cause = cause;
  }

  static timeout(guardName: string, ms: number): GuardError {
    return new GuardError('TIMEOUT', `Guard "${guardName}" timed out after ${ms}ms`);
  }

  static fromException(guardName: string, cause: Error): GuardError {
    return new GuardError('EXCEPTION', `Guard "${guardName}" threw: ${cause.message}`, cause);
  }

  static network(guardName: string, detail: string): GuardError {
    return new GuardError('NETWORK', `Guard "${guardName}" network error: ${detail}`);
  }

  static invalidConfig(guardName: string, detail: string): GuardError {
    return new GuardError('INVALID_CONFIG', `Guard "${guardName}" config error: ${detail}`);
  }

  toJSON(): GuardErrorInfo {
    return { code: this.code, message: this.message };
  }
}
