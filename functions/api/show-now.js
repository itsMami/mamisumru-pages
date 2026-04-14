export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const imageId = Number(body.id);

    if (!Number.isInteger(imageId) || imageId <= 0) {
      return Response.json({ ok: false, error: "Invalid image id" }, { status: 400 });
    }

    const image = await env.DB.prepare(
      "SELECT id FROM images WHERE id = ? LIMIT 1"
    ).bind(imageId).first();

    if (!image) {
      return Response.json({ ok: false, error: "Image not found" }, { status: 404 });
    }

    await env.DB.prepare(`
      INSERT INTO settings (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).bind("show_now_id", String(imageId)).run();

    return Response.json({
      ok: true,
      show_now_id: imageId
    });
  } catch (error) {
    return Response.json({
      ok: false,
      error: String(error)
    }, { status: 500 });
  }
}