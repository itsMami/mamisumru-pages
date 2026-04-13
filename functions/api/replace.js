export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const formData = await request.formData();
    const id = Number(formData.get("id"));
    const file = formData.get("file");

    if (!Number.isInteger(id) || id <= 0) {
      return Response.json({ ok: false, error: "Invalid image id" }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return Response.json({ ok: false, error: "No file uploaded" }, { status: 400 });
    }

    const contentType = file.type || "application/octet-stream";
    if (!contentType.startsWith("image/")) {
      return Response.json({ ok: false, error: "Uploaded file must be an image" }, { status: 400 });
    }

    const existing = await env.DB.prepare(
      "SELECT id, r2_key FROM images WHERE id = ? LIMIT 1"
    ).bind(id).first();

    if (!existing) {
      return Response.json({ ok: false, error: "Image not found" }, { status: 404 });
    }

    const ext = file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : "png";
    const newKey = `images/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();

    await env.IMAGES_BUCKET.put(newKey, arrayBuffer, {
      httpMetadata: { contentType }
    });

    await env.DB.prepare(`
      UPDATE images
      SET filename = ?, r2_key = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(file.name, newKey, id).run();

    await env.IMAGES_BUCKET.delete(existing.r2_key);

    const updated = await env.DB.prepare(`
      SELECT id, filename, r2_key, display_order, created_at, updated_at, enabled
      FROM images
      WHERE id = ?
      LIMIT 1
    `).bind(id).first();

    return Response.json({
      ok: true,
      image: updated
    });
  } catch (error) {
    return Response.json({
      ok: false,
      error: String(error)
    }, { status: 500 });
  }
}