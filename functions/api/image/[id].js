export async function onRequestGet(context) {
  const { env } = context;

  try {
    const refreshStmt = env.DB.prepare(
      "SELECT value FROM settings WHERE key = ? LIMIT 1"
    ).bind("refresh_time");

    const imagesStmt = env.DB.prepare(`
      SELECT id, filename, r2_key, display_order, created_at, enabled
      FROM images
      WHERE enabled = 1
      ORDER BY display_order ASC, id ASC
    `);

    const [refreshResult, imagesResult] = await Promise.all([
      refreshStmt.first(),
      imagesStmt.all(),
    ]);

    const refreshTime = refreshResult ? Number(refreshResult.value) : 600;
    const images = (imagesResult.results || []).map((img) => ({
      ...img,
      image_url: `/api/image/${img.id}`
    }));

    return Response.json({
      ok: true,
      refresh_time: refreshTime,
      images,
    });
  } catch (error) {
    return Response.json({
      ok: false,
      error: String(error),
      stack: error && error.stack ? String(error.stack) : null
    }, {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}