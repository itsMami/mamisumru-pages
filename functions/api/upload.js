function sanitizeBaseName(name) {
  return name
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "image";
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const formData = await request.formData();
    const files = formData.getAll("files");

    if (!files || files.length === 0) {
      return Response.json({ ok: false, error: "No files uploaded" }, { status: 400 });
    }

    const saved = [];

    for (const file of files) {
      if (!(file instanceof File)) continue;

      const contentType = file.type || "application/octet-stream";
      if (!contentType.startsWith("image/")) continue;

      const ext = file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : "png";
      const base = sanitizeBaseName(file.name);
      const key = `images/${Date.now()}-${crypto.randomUUID()}.${ext}`;

      const arrayBuffer = await file.arrayBuffer();

      await env.IMAGES_BUCKET.put(key, arrayBuffer, {
        httpMetadata: {
          contentType
        }
      });

      const maxOrderRow = await env.DB.prepare(
        "SELECT COALESCE(MAX(display_order), -1) AS max_order FROM images"
      ).first();

      const nextOrder = Number(maxOrderRow?.max_order ?? -1) + 1;

      const result = await env.DB.prepare(`
        INSERT INTO images (filename, r2_key, display_order, enabled)
        VALUES (?, ?, ?, 1)
        RETURNING id, filename, r2_key, display_order, created_at, enabled
      `).bind(file.name, key, nextOrder).first();

      saved.push(result);
    }

    return Response.json({
      ok: true,
      saved
    });
  } catch (error) {
    return Response.json({
      ok: false,
      error: String(error)
    }, { status: 500 });
  }
}