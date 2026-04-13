export async function onRequestGet(context) {
  const { env } = context;

  try {
    const refreshStmt = env.DB.prepare(
      "SELECT value FROM settings WHERE key = ? LIMIT 1"
    ).bind("refresh_time");

    const currentStmt = env.DB.prepare(
      "SELECT value FROM settings WHERE key = ? LIMIT 1"
    ).bind("current_display");

    const imagesStmt = env.DB.prepare(`
      SELECT id, filename, r2_key, display_order, created_at, updated_at, enabled
      FROM images
      WHERE enabled = 1
      ORDER BY display_order ASC, id ASC
    `);

    const [refreshResult, currentResult, imagesResult] = await Promise.all([
      refreshStmt.first(),
      currentStmt.first(),
      imagesStmt.all(),
    ]);

    const refreshTime = refreshResult ? Number(refreshResult.value) : 600;
    const currentDisplay = currentResult ? currentResult.value : "";
    const images = (imagesResult.results || []).map((img) => ({
      ...img,
      image_url: `/api/image/${img.id}?v=${encodeURIComponent(img.updated_at || img.created_at || "")}`,
      local_name: `cloud_${img.id}.png`
    }));

    return Response.json({
      ok: true,
      refresh_time: refreshTime,
      current_display: currentDisplay,
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