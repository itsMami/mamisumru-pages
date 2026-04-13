export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const currentDisplay = String(body.current_display || "").trim();

    await env.DB.prepare(`
      INSERT INTO settings (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).bind("current_display", currentDisplay).run();

    return Response.json({
      ok: true,
      current_display: currentDisplay
    });
  } catch (error) {
    return Response.json({
      ok: false,
      error: String(error)
    }, { status: 500 });
  }
}