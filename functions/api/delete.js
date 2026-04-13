export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const imageId = Number(body.id);

    if (!Number.isInteger(imageId) || imageId <= 0) {
      return Response.json({ ok: false, error: "Invalid image id" }, { status: 400 });
    }

    const image = await env.DB.prepare(
      "SELECT id, r2_key FROM images WHERE id = ? LIMIT 1"
    ).bind(imageId).first();

    if (!image) {
      return Response.json({ ok: false, error: "Image not found" }, { status: 404 });
    }

    await env.IMAGES_BUCKET.delete(image.r2_key);

    await env.DB.prepare(
      "DELETE FROM images WHERE id = ?"
    ).bind(imageId).run();

    const rows = await env.DB.prepare(
      "SELECT id FROM images ORDER BY display_order ASC, id ASC"
    ).all();

    const statements = (rows.results || []).map((row, index) =>
      env.DB.prepare("UPDATE images SET display_order = ? WHERE id = ?").bind(index, row.id)
    );

    if (statements.length) {
      await env.DB.batch(statements);
    }

    return Response.json({
      ok: true,
      deleted_id: imageId
    });
  } catch (error) {
    return Response.json({
      ok: false,
      error: String(error)
    }, { status: 500 });
  }
}