import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { SimpleSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { OTLPTraceExporter } from '@opentelemetry/exporter-otlp-proto';
import { Resource } from "@opentelemetry/resources";
import { SemanticAttributes, SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { ExpressInstrumentation } from "opentelemetry-instrumentation-express";
import { MongooseInstrumentation } from "opentelemetry-instrumentation-mongoose";

import { getEnv, ParentBasedSampler, TraceIdRatioBasedSampler } from "@opentelemetry/core"
import { Context, diag, DiagConsoleLogger, Link, Sampler, SamplingDecision, SamplingResult, Span, SpanAttributes, SpanKind, TraceFlags } from "@opentelemetry/api";
// diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
diag.setLogger(new DiagConsoleLogger(), getEnv().OTEL_LOG_LEVEL);

// Custom sampler that reduce noise on '/users' endpoint
const ratioSampler: Sampler = new TraceIdRatioBasedSampler(0.001);
const myCustomSampler: Sampler = {
    shouldSample: function (context: Context, traceId: string, spanName: string, spanKind: SpanKind, attributes: SpanAttributes, links: Link[]): SamplingResult {
        if(attributes[SemanticAttributes.HTTP_TARGET] === '/users') {
            return ratioSampler.shouldSample(context, traceId, spanName, spanKind, attributes, links);
        }
        if (process.env.NODE_ENV === 'development') {
            return {
                decision: SamplingDecision.RECORD_AND_SAMPLED
            }    
        }
        return {
            decision: SamplingDecision.RECORD_AND_SAMPLED
        }
    }
}

// register provider with sampler
const provider = new NodeTracerProvider({ 
    resource: new Resource({[SemanticResourceAttributes.SERVICE_NAME]: 'otel-troubleshooting'}),
    sampler: new ParentBasedSampler({ root: myCustomSampler }),
});
const exporter = new OTLPTraceExporter({ url: 'http://localhost:4318/v1/traces'});
provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
provider.register();

registerInstrumentations({ instrumentations: [
    new HttpInstrumentation(),
    new ExpressInstrumentation(),
    new MongooseInstrumentation(),
]})
console.log('tracing enabled');

