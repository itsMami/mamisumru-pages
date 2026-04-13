export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const refreshTime = Number(body.refresh_time);

  if (!Number.isInteger(refreshTime) || refreshTime <= 0) {
    return Response.json(
      { ok: false, error: "refresh_time must be a positive integer" },
      { status: 400 }
    );
  }

  await env.DB.prepare(`
    INSERT INTO settings (key, value)
    VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).bind("refresh_time", String(refreshTime)).run();

  return Response.json({
    ok: true,
    refresh_time: refreshTime,
  });
}