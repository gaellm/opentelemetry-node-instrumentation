//npm install --save @opentelemetry/api @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node @opentelemetry/exporter-collector-grpc opentelemetry-instrumentation-mongoose opentelemetry-instrumentation-amqplib 
'use strict'

import { NodeSDK } from '@opentelemetry/sdk-node';
import { ConsoleSpanExporter, SpanExporter } from '@opentelemetry/sdk-trace-base';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { CollectorTraceExporter } from '@opentelemetry/exporter-collector-grpc';
import { MongooseInstrumentation } from 'opentelemetry-instrumentation-mongoose';
import { AmqplibInstrumentation } from 'opentelemetry-instrumentation-amqplib';
import { ParentBasedSampler, TraceIdRatioBasedSampler, AlwaysOnSampler, AlwaysOffSampler } from '@opentelemetry/core';
import { diag, DiagConsoleLogger, DiagLogLevel, Sampler } from '@opentelemetry/api';
import { getEnvironment, ENVIRONMENT } from './environment'

const env: ENVIRONMENT = getEnvironment();

/**
 * Start tracing
 * Default auto instrumentations + Mongoose and Amqp
 */
export function startTracing() {

  /** Define OpenTelemetry log level */
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel[env.OTEL_LOG_LEVEL]);
  diag.info("OpenTelemetry options: " + JSON.stringify(env));

  /** Create an exporter client */
  let traceExporter: SpanExporter = new ConsoleSpanExporter();
  if(env.OTEL_EXPORTER_OTLP_ENDPOINT) {

    diag.info(`Create exporter client to $OTEL_EXPORTER_OTLP_ENDPOINT`);

    traceExporter = new CollectorTraceExporter({
      url: env.OTEL_EXPORTER_OTLP_ENDPOINT
    });
  } else {
    diag.info(`Create exporter console exporter client`);
  };

  /** Set the sampling */
  const traceSampler: Sampler = (() => {
      switch(env.OTEL_TRACES_SAMPLER) {

        case 'parentbased_traceidratio':
          return new ParentBasedSampler({
            root: new TraceIdRatioBasedSampler(env.OTEL_TRACES_SAMPLER_ARG)
          });
        case 'always_on':
          return new AlwaysOnSampler();
        case 'always_off':
          return new AlwaysOffSampler();
        default:
          diag.error(`Sorry, this sampler doesn't exist ${env.OTEL_TRACES_SAMPLER}.`);
      }  
  })();

  /** Get headers keys to add in spans */
  const httpCaptureHeadersServerRequest: string[] = env.OTEL_INSTRUMENTATION_HTTP_CAPTURE_HEADERS_SERVER_REQUEST.split(',');
  
  /** Get paths to ignore ['/metrics','/','/health'] */
  const httpIgnoreIncomingPaths: string[] = env.OTEL_INSTRUMENTATION_HTTP_IGNORE_INCOMING_PATHS.split(',');

  /** 
   * Create and configure OpenTelemetry SDK 
   * 
   * Default auto instrumentations + Mongoose and Amqp
   */
  const sdk:NodeSDK  = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: env.OTEL_SERVICE_NAME,
      [SemanticResourceAttributes.SERVICE_VERSION]: env.OTEL_SERVICE_VERSION,
      [SemanticResourceAttributes.SERVICE_NAMESPACE]: env.OTEL_SERVICE_NAMESPACE,
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: env.OTEL_DEPLOYMENT_ENVIRONMENT
    }),
    traceExporter,
    instrumentations: [
        getNodeAutoInstrumentations({
          '@opentelemetry/instrumentation-http': {
            headersToSpanAttributes: {
              server: { 
                requestHeaders: httpCaptureHeadersServerRequest
              }
            },
            ignoreIncomingPaths: httpIgnoreIncomingPaths
          }
        }),
        new MongooseInstrumentation({
          /** 
           * See under for available configuration
           * https://github.com/aspecto-io/opentelemetry-ext-js/tree/master/packages/instrumentation-mongoose
           */
          suppressInternalInstrumentation: false,
          dbStatementSerializer: (operation, payload) => {

              return JSON.stringify(payload);
          }}),
        new AmqplibInstrumentation({
          /**
           * See under for available configuration
           * https://github.com/aspecto-io/opentelemetry-ext-js/tree/master/packages/instrumentation-amqplib
           */
        })],

    sampler: traceSampler
  });

  /**  
   * Initialize the SDK and register with the OpenTelemetry API
   * this enables the API to record telemetry
   */
  sdk.start()
    .then(() => diag.info('Tracing initialized'))
    .catch((error) => diag.error('Error initializing tracing', error));

  /** Gracefully shut down the SDK on process exit */
  process.on('SIGTERM', () => {
    sdk.shutdown()
      .then(() => diag.info('Tracing terminated'))
      .catch((error) => diag.error('Error terminating tracing', error))
      .finally(() => process.exit(0));
  });
};