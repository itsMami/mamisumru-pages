function unauthorized() {
  return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const token = request.headers.get("x-pi-token");
  if (!token || token !== env.PI_SHARED_TOKEN) {
    return unauthorized();
  }

  try {
    const body = await request.json();
    const playlist = body.playlist ?? [];
    const state = body.state ?? {};
    const executedCommandId = Number(body.executed_command_id || 0);

    const statements = [
      env.DB.prepare(`
        INSERT INTO music_runtime (key, value, updated_at)
        VALUES ('playlist_json', ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET
          value = excluded.value,
          updated_at = CURRENT_TIMESTAMP
      `).bind(JSON.stringify(playlist)),

      env.DB.prepare(`
        INSERT INTO music_runtime (key, value, updated_at)
        VALUES ('state_json', ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET
          value = excluded.value,
          updated_at = CURRENT_TIMESTAMP
      `).bind(JSON.stringify(state)),
    ];

    if (executedCommandId > 0) {
      statements.push(
        env.DB.prepare(`
          UPDATE music_commands
          SET status = 'done', executed_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(executedCommandId)
      );
    }

    await env.DB.batch(statements);

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({
      ok: false,
      error: String(error)
    }, { status: 500 });
  }
}