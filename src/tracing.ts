import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { SimpleSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { OTLPTraceExporter } from '@opentelemetry/exporter-otlp-proto';
import { trace } from '@opentelemetry/api';
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { ExpressInstrumentation } from "opentelemetry-instrumentation-express";
import { MongooseInstrumentation } from "opentelemetry-instrumentation-mongoose";
import { IORedisInstrumentation } from "@opentelemetry/instrumentation-ioredis";

import { getEnv } from "@opentelemetry/core"
import { diag, DiagConsoleLogger } from "@opentelemetry/api";
diag.setLogger(new DiagConsoleLogger(), getEnv().OTEL_LOG_LEVEL);

const provider = new NodeTracerProvider({ 
    resource: new Resource({[SemanticResourceAttributes.SERVICE_NAME]: 'otel-troubleshooting'})
});
const exporter = new OTLPTraceExporter({ url: 'http://localhost:4318/v1/traces'});
provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
provider.register();

registerInstrumentations({ instrumentations: [
    new HttpInstrumentation(),
    new ExpressInstrumentation(),
    new MongooseInstrumentation(),
    new IORedisInstrumentation(),
]})
console.log('tracing enabled');

