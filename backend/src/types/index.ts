export type Environment = 'development' | 'production' | 'test';

export interface AppConfig {
  env: Environment;
  port: number;
  apiPrefix: string;
  frontendOrigin: string;
  logLevel: string;
  isDev: boolean;
  isProd: boolean;
  isTest: boolean;
}

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorPayload;
}

export interface HealthCheckResponse {
  success: true;
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  timestamp: string;
  uptimeSeconds: number;
  environment: Environment;
}

export interface ApiInfoResponse {
  service: string;
  version: string;
  environment: Environment;
  description: string;
  docs: string;
  pipelineStage: string;
  modules: Record<string, string>;
}
