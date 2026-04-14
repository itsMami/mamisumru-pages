export async function onRequestPost(context) {
  const { env } = context;
  try {
    const res = await fetch(`${env.MUSIC_API_BASE}/play`, { method: "POST" });
    return Response.json(await res.json());
  } catch (error) {
    return Response.json({ ok: false, error: String(error) }, { status: 500 });
  }
}