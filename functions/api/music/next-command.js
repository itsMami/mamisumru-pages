function unauthorized() {
  return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
}

export async function onRequestGet(context) {
  const { request, env } = context;

  const token = request.headers.get("x-pi-token");
  if (!token || token !== env.PI_SHARED_TOKEN) {
    return unauthorized();
  }

  try {
    const row = await env.DB.prepare(`
      SELECT id, command, payload, created_at
      FROM music_commands
      WHERE status = 'pending'
      ORDER BY id ASC
      LIMIT 1
    `).first();

    if (!row) {
      return Response.json({ ok: true, command: null });
    }

    return Response.json({
      ok: true,
      command: {
        id: row.id,
        command: row.command,
        payload: JSON.parse(row.payload || "{}"),
        created_at: row.created_at
      }
    });
  } catch (error) {
    return Response.json({
      ok: false,
      error: String(error)
    }, { status: 500 });
  }
}