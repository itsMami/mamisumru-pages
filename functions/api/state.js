export async function onRequestGet(context) {
  const { env } = context;

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
  const images = imagesResult.results || [];

  return Response.json({
    ok: true,
    refresh_time: refreshTime,
    images,
  });
}