This repository generate a docker image, hosting an opentelemetry-node-instrumentation.tar.gz file. This file can extract a module folder in the Node.js project root directory, to automatically add a distributed tracing, using opentelemetry sdk.

## Version
This module use the **@opentelemetry/api** version **1.0.4**.

## Local use

Open the app's root dir and extract the opentelemetry-node-instrumentation folder:

```console
cd myapp
docker cp $(docker create --rm opentelemetry-node-instrumentation-image:1.0.4):/usr/local/share/opentelemetry-node-instrumentation.tar.gz .
tar -xzvf opentelemetry-node-instrumentation.tar.gz
```

Then add a preload module on app start cli using *-r* or *--require* :

```console
OTEL_SERVICE_NAME=myapp  \
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317 \
node -r './opentelemetry-node-instrumentation' app.js
```

## As Kubernetes init container

Your application containers:
```yaml
      containers:
      - name: customer-app
        image: node
        command:
        - node
        - -r
        - '/opt/opentelemetry-node-instrumentation'
        - app.js
        env:
        - name: OTEL_SERVICE_NAME
          value: <your-service-name>
        - name: OTEL_EXPORTER_OTLP_ENDPOINT
          value: <collector_endpoint>
        volumeMounts:
        - mountPath: /opt/opentelemetry-node-instrumentation
          name: opentelemetry-node-instrumentation
```

Initcontainer to extract opentelemetry-nodemodule
```yaml
      initContainers:
      - name: opentelemetry-node-instrumentation-extractor
        image: opentelemetry-node-instrumentation-image:1.0.4
        command:
        - /bin/tar
        args:
        - -xzvf
        - opentelemetry-node-instrumentation.tar.gz
        - -C
        - /opt/
        volumeMounts:
        - mountPath: /opt/opentelemetry-node-instrumentation
          name: opentelemetry-node-instrumentation
```

Make opentelemetry-node-instrumentation available as a volume
```yaml
      volumes:
      - name: opentelemetry-node-instrumentation
        emptyDir: {}
```

## Environment variables

| Env variable                                              | Default value               |
|:----------------------------------------------------------|:----------------------------|
| OTEL_LOG_LEVEL                                            | INFO                        |
| OTEL_SERVICE_NAME                                         | unknown_service             |
| OTEL_SERVICE_VERSION                                      | 1.0                         |
| OTEL_SERVICE_NAMESPACE                                    | default                     |
| OTEL_DEPLOYMENT_ENVIRONMENT                               | all                         |
| OTEL_EXPORTER_OTLP_ENDPOINT                               |                             |
| OTEL_TRACES_SAMPLER                                       | parentbased_traceidratio    |
| OTEL_TRACES_SAMPLER_ARG                                   | 1.0                         |
| OTEL_INSTRUMENTATION_HTTP_CAPTURE_HEADERS_SERVER_REQUEST  | ''                          |
| OTEL_INSTRUMENTATION_HTTP_IGNORE_INCOMING_PATHS           | ''                          |
