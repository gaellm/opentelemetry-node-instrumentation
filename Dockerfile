FROM node:16-alpine as tsc-stage
WORKDIR /usr/src/opentelemetry-node-instrumentation
COPY . ./
RUN npm ci
RUN ./node_modules/.bin/tsc

FROM node:16-alpine as compress
WORKDIR /usr/src/opentelemetry-node-instrumentation
COPY --from=tsc-stage /usr/src/opentelemetry-node-instrumentation/dist/src/* .
COPY --from=tsc-stage /usr/src/opentelemetry-node-instrumentation/package*.json .
RUN npm ci --production
RUN cd .. && tar -czvf /usr/local/share/opentelemetry-node-instrumentation.tar.gz ./opentelemetry-node-instrumentation

FROM busybox
WORKDIR /usr/local/share
COPY --from=compress /usr/local/share/opentelemetry-node-instrumentation.tar.gz .