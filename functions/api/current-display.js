export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const currentDisplay = String(body.current_display || "").trim();
    const refreshTime = Number(body.refresh_time || 0);
    const lastChangeTime = body.last_change_time
      ? String(body.last_change_time)
      : new Date().toISOString();

    await env.DB.batch([
      env.DB.prepare(`
        INSERT INTO settings (key, value)
        VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `).bind("current_display", currentDisplay),

      env.DB.prepare(`
        INSERT INTO settings (key, value)
        VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `).bind("last_change_time", lastChangeTime),

      env.DB.prepare(`
        INSERT INTO settings (key, value)
        VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `).bind("refresh_time", String(refreshTime > 0 ? refreshTime : 600)),
    ]);

    return Response.json({
      ok: true,
      current_display: currentDisplay,
      last_change_time: lastChangeTime,
      refresh_time: refreshTime > 0 ? refreshTime : 600
    });
  } catch (error) {
    return Response.json({
      ok: false,
      error: String(error)
    }, { status: 500 });
  }
}