// app/api/baml/route.js - Fixed BAML Pragmatic API for Vercel

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

    // Dynamic import to avoid module loading issues
    const { BAMLPragmatic } = await import('../../../src/baml-system/baml-pragmatic.js');

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log('🧠 Initializing BAML Pragmatic...');
          const baml = new BAMLPragmatic();

          // 1. Domain detection
          console.log('🔍 Detecting domain...');
          const domain = await baml.detectDomain(prompt);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'domain',
              domain: domain,
              message: `Domain detected: ${domain}`
            })}\n\n`)
          );

          // 2. SCoT Enhancement
          console.log('⚡ Enhancing with SCoT...');
          const enhancedPrompt = baml.enhanceWithSCoT(prompt);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'enhancement',
              length: enhancedPrompt.length,
              message: `Prompt enhanced with SCoT: ${enhancedPrompt.length} chars`
            })}\n\n`)
          );

          // 3. Domain expertise
          console.log('🎓 Loading domain expertise...');
          const domainExpertise = baml.domainPrompts[domain];
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'expertise',
              domain: domain,
              message: `Domain expertise loaded: ${domain}`,
              expertiseLength: domainExpertise?.length || 0
            })}\n\n`)
          );

          // 4. AI Generation
          console.log('🤖 Starting AI generation...');
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'generation_start',
              message: 'Starting AI generation with BAML Pragmatic...'
            })}\n\n`)
          );

          // Use streaming handler for actual generation
          const onProgress = (progress) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({
                type: 'progress',
                ...progress
              })}\n\n`)
            );
          };

          const result = await baml.streamingHandler.generateWithStream(
            enhancedPrompt,
            null, // Use default model
            onProgress
          );

          // 5. Final result
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'content',
              chunk: result,
              domain: domain,
              stats: {
                domain: domain,
                promptLength: prompt.length,
                enhancedLength: enhancedPrompt.length,
                resultLength: result.length
              }
            })}\n\n`)
          );

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();

        } catch (error) {
          console.error('🚨 BAML Pragmatic API Error:', error);
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