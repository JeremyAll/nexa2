// app/api/baml/route.js - Simplified BAML API for Vercel

import { StreamingHandler } from '../../../src/streaming-handler.js';

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
          console.log('🎯 Initializing StreamingHandler...');
          const handler = new StreamingHandler();

          // Use Sonnet-4 for BAML mode (high quality)
          const model = 'claude-sonnet-4-20250514';

          console.log(`🤖 Using model: ${model}`);

          // Simulate BAML progress for UI compatibility
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'domain',
              domain: 'general',
              message: 'Domain detected: general'
            })}\n\n`)
          );

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'generation_start',
              message: 'Starting AI generation with enhanced prompting...'
            })}\n\n`)
          );

          // Add progress callback for debugging
          const onProgress = (progress) => {
            console.log('Progress:', progress);
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({
                type: 'progress',
                ...progress
              })}\n\n`)
            );
          };

          const result = await handler.generateWithStream(prompt, model, onProgress);

          // Stream the final result
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'content',
              chunk: result,
              domain: 'general',
              stats: {
                domain: 'general',
                promptLength: prompt.length,
                resultLength: result.length
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