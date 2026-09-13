import { NextResponse } from 'next/server';
import { globalEmitter } from '@/lib/eventEmitter';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  let responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  // Keep connection alive
  const keepAlive = setInterval(() => {
    writer.write(encoder.encode(': keepalive\n\n'));
  }, 15000);

  const onEvent = (data: any) => {
    writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
  };

  globalEmitter.on('hospital_event', onEvent);

  request.signal.addEventListener('abort', () => {
    clearInterval(keepAlive);
    globalEmitter.off('hospital_event', onEvent);
    writer.close();
  });

  return new NextResponse(responseStream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}

// Endpoint to trigger events (e.g. from the client or from identity-svc webhooks)
export async function POST(request: Request) {
  try {
    const data = await request.json();
    globalEmitter.emit('hospital_event', data);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to broadcast event' }, { status: 500 });
  }
}
