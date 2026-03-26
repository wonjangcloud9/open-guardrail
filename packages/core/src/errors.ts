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
    return new GuardError(
      'TIMEOUT',
      `Guard "${guardName}" timed out after ${ms}ms. ` +
      `Hints: (1) increase timeoutMs, (2) wrap with retry(), (3) wrap with circuitBreaker() for resilience`,
    );
  }

  static fromException(guardName: string, cause: Error): GuardError {
    return new GuardError(
      'EXCEPTION',
      `Guard "${guardName}" threw: ${cause.message}. ` +
      `Hints: (1) wrap with fallback() for graceful degradation, (2) wrap with retry() for transient errors`,
      cause,
    );
  }

  static network(guardName: string, detail: string): GuardError {
    return new GuardError(
      'NETWORK',
      `Guard "${guardName}" network error: ${detail}. ` +
      `Hints: (1) check API key/endpoint, (2) wrap with retry({ maxRetries: 3 }), (3) wrap with circuitBreaker()`,
    );
  }

  static invalidConfig(guardName: string, detail: string): GuardError {
    return new GuardError(
      'INVALID_CONFIG',
      `Guard "${guardName}" config error: ${detail}. ` +
      `Check the guard's TypeScript interface for valid options`,
    );
  }

  static pipelineNotFound(stage: string, available: string[]): GuardError {
    return new GuardError(
      'INVALID_CONFIG',
      `Pipeline "${stage}" is not configured. Available: [${available.join(', ')}]`,
    );
  }

  toJSON(): GuardErrorInfo {
    return { code: this.code, message: this.message };
  }
}
