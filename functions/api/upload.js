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

    const validFiles = files.filter(
      (file) => file instanceof File && (file.type || "").startsWith("image/")
    );

    if (validFiles.length === 0) {
      return Response.json({ ok: false, error: "No valid image files uploaded" }, { status: 400 });
    }

    const saved = [];

    for (const file of validFiles) {
      const contentType = file.type || "application/octet-stream";
      const ext = file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : "png";
      const base = sanitizeBaseName(file.name);
      const key = `images/${Date.now()}-${base}-${crypto.randomUUID()}.${ext}`;

      const arrayBuffer = await file.arrayBuffer();

      await env.IMAGES_BUCKET.put(key, arrayBuffer, {
        httpMetadata: { contentType }
      });

      const maxOrderRow = await env.DB.prepare(
        "SELECT COALESCE(MAX(display_order), -1) AS max_order FROM images"
      ).first();

      const nextOrder = Number(maxOrderRow?.max_order ?? -1) + 1;

      await env.DB.prepare(`
        INSERT INTO images (filename, r2_key, display_order, enabled)
        VALUES (?, ?, ?, 1)
      `).bind(file.name, key, nextOrder).run();

      const inserted = await env.DB.prepare(`
        SELECT id, filename, r2_key, display_order, created_at, enabled
        FROM images
        WHERE r2_key = ?
        LIMIT 1
      `).bind(key).first();

      saved.push(inserted);
    }

    return Response.json({ ok: true, saved });
  } catch (error) {
    return Response.json({
      ok: false,
      error: String(error)
    }, { status: 500 });
  }
}