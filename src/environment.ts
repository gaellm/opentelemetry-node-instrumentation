export type ENVIRONMENT = {
    OTEL_LOG_LEVEL?: string;
    OTEL_SERVICE_NAME?: string;
    OTEL_SERVICE_VERSION?: string;
    OTEL_SERVICE_NAMESPACE?: string;
    OTEL_DEPLOYMENT_ENVIRONMENT?: string;
    OTEL_EXPORTER_OTLP_ENDPOINT?: string;
    OTEL_TRACES_SAMPLER?: string;
    OTEL_TRACES_SAMPLER_ARG?: number;
    OTEL_INSTRUMENTATION_HTTP_CAPTURE_HEADERS_SERVER_REQUEST?: string;
    OTEL_INSTRUMENTATION_HTTP_IGNORE_INCOMING_PATHS?: string;
};

export const DEFAULT_ENVIRONMENT: Required<ENVIRONMENT> = {
    OTEL_LOG_LEVEL: 'INFO',
    OTEL_SERVICE_NAME: 'unknown_service',
    OTEL_SERVICE_VERSION: '1.0',
    OTEL_SERVICE_NAMESPACE: 'default',
    OTEL_DEPLOYMENT_ENVIRONMENT: 'all',
    OTEL_EXPORTER_OTLP_ENDPOINT: undefined /** 'grpc://localhost:4317'*/,
    OTEL_TRACES_SAMPLER: 'parentbased_traceidratio',
    OTEL_TRACES_SAMPLER_ARG: 1.0,
    OTEL_INSTRUMENTATION_HTTP_CAPTURE_HEADERS_SERVER_REQUEST: '',
    OTEL_INSTRUMENTATION_HTTP_IGNORE_INCOMING_PATHS: ''
};

export type RAW_ENVIRONMENT = {
    [key: string]: string | number | undefined | string[];
  };

export function getEnvironment(): ENVIRONMENT {
    const environment: ENVIRONMENT & RAW_ENVIRONMENT = {};
  
    for (const env in DEFAULT_ENVIRONMENT) {
      const key = env as keyof ENVIRONMENT;

      switch (key) {
        case 'OTEL_TRACES_SAMPLER_ARG':
          environment[key] =  (process.env[key])? Number(process.env[key]) : DEFAULT_ENVIRONMENT[key]
          break;

        default:
          environment[key] =  (process.env[key])? process.env[key] : DEFAULT_ENVIRONMENT[key]
      }
    }
    return environment;
};