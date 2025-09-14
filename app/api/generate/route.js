// app/api/generate/route.js - Fixed for Vercel deployment
import { StreamingHandler } from '../../../src/streaming-handler.js';

export async function POST(request) {
  // Add environment check and logging
  console.log('🚀 Generate API called:', {
    hasApiKey: !!process.env.ANTHROPIC_API_KEY,
    nodeEnv: process.env.NODE_ENV,
    url: request.url
  });

  try {
    const { prompt } = await request.json();

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

          // Use Haiku 3.5 for fast mode or Sonnet-4 for production
          const model = request.headers.get('x-fast-mode')
            ? 'claude-3-5-haiku-20241022'
            : 'claude-sonnet-4-20250514';

          console.log(`🤖 Using model: ${model}`);

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
              model: model,
              fastMode: !!request.headers.get('x-fast-mode')
            })}\n\n`)
          );

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();

        } catch (error) {
          console.error('🚨 Streaming error:', error);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'error',
              error: error.message
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
        'Access-Control-Allow-Headers': 'Content-Type, x-fast-mode'
      }
    });

  } catch (error) {
    console.error('🚨 Generate API Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}