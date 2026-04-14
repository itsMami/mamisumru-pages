export async function onRequestGet(context) {
  const { env } = context;

  try {
    const res = await fetch(`${env.MUSIC_API_BASE}/status`);
    const data = await res.json();
    return Response.json(data);
  } catch (error) {
    return Response.json({ ok: false, error: String(error) }, { status: 500 });
  }
}