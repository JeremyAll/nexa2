// app/api/baml/route.js - BAML Pragmatic API with Domain Intelligence

import { BAMLPragmatic } from '../../../src/baml-system/baml-pragmatic.js';

export async function POST(request) {
  // Environment check and logging
  console.log('🎯 BAML API called:', {
    hasApiKey: !!process.env.ANTHROPIC_API_KEY,
    nodeEnv: process.env.NODE_ENV,
    url: request.url
  });

  try {
    const { prompt, options = {} } = await request.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log('🎯 Initializing BAML Pragmatic...');
          const baml = new BAMLPragmatic();

          console.log(`🧠 BAML Pragmatic: Domain Detection + SCoT Enhancement`);

          // Detect domain first
          const domain = await baml.detectDomain(prompt);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'domain',
              domain: domain,
              message: `Domain detected: ${domain}`
            })}\n\n`)
          );

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'generation_start',
              message: `Starting BAML Pragmatic generation with ${domain} expertise...`
            })}\n\n`)
          );

          // Add progress callback for streaming updates
          const onProgress = (progress) => {
            console.log('BAML Progress:', progress);
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({
                type: 'progress',
                domain: domain,
                ...progress
              })}\n\n`)
            );
          };

          // Use BAML Pragmatic for domain-aware generation
          const result = await baml.generate(prompt);

          // Stream the final result with domain intelligence
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'content',
              chunk: result,
              domain: domain,
              stats: {
                domain: domain,
                promptLength: prompt.length,
                resultLength: result.length,
                bamlPragmatic: true,
                scotEnhancement: true
              }
            })}\n\n`)
          );

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();

        } catch (error) {
          console.error('🚨 BAML API Error:', error);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'error',
              error: error.message,
              stack: error.stack
            })}\n\n`)
          );
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });

  } catch (error) {
    console.error('🚨 BAML API Error:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        stack: error.stack
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}