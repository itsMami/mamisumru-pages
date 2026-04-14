const ALLOWED_COMMANDS = new Set([
  "play",
  "pause",
  "stop",
  "next",
  "prev",
  "select",
  "volume"
]);

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const command = String(body.command || "").trim();
    const payload = body.payload ?? {};

    if (!ALLOWED_COMMANDS.has(command)) {
      return Response.json({ ok: false, error: "Invalid command" }, { status: 400 });
    }

    await env.DB.prepare(`
      INSERT INTO music_commands (command, payload, status)
      VALUES (?, ?, 'pending')
    `).bind(command, JSON.stringify(payload)).run();

    return Response.json({
      ok: true,
      command,
      payload
    });
  } catch (error) {
    return Response.json({
      ok: false,
      error: String(error)
    }, { status: 500 });
  }
}