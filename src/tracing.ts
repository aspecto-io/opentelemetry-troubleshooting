import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { SimpleSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { OTLPTraceExporter } from '@opentelemetry/exporter-otlp-proto';
import { trace } from '@opentelemetry/api';
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

const provider = new NodeTracerProvider({ 
    resource: new Resource({[SemanticResourceAttributes.SERVICE_NAME]: 'otel-troubleshooting'})
});
const exporter = new OTLPTraceExporter({ url: 'http://localhost:4318/v1/trace'});
provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
provider.register();
console.log('tracing enabled');

trace.getTracer('test').startSpan('manual span').end();
