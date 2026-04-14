export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json();
    const res = await fetch(`${env.MUSIC_API_BASE}/volume`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return Response.json(await res.json());
  } catch (error) {
    return Response.json({ ok: false, error: String(error) }, { status: 500 });
  }
}