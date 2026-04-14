export async function onRequestGet(context) {
  const { env } = context;

  try {
    const rows = await env.DB.prepare(`
      SELECT key, value
      FROM music_runtime
      WHERE key IN ('playlist_json', 'state_json')
    `).all();

    const map = {};
    for (const row of rows.results || []) {
      map[row.key] = row.value;
    }

    const playlist = JSON.parse(map.playlist_json || "[]");
    const state = JSON.parse(map.state_json || "{}");

    return Response.json({
      ok: true,
      playlist,
      state
    });
  } catch (error) {
    return Response.json({
      ok: false,
      error: String(error)
    }, { status: 500 });
  }
}