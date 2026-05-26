const clients = new Set();
const encoder = new TextEncoder();

export async function GET() {
  let controller;
  const stream = new ReadableStream({
    start(c) {
      controller = c;
      clients.add(controller);
      controller.enqueue(encoder.encode(": connected\n\n"));
    },
    cancel() {
      clients.delete(controller);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

export async function POST() {
  for (const client of clients) {
    try {
      client.enqueue(encoder.encode("data: trigger\n\n"));
    } catch {
      clients.delete(client);
    }
  }
  return new Response("OK");
}
