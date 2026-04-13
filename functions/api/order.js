export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const order = body.order;

  if (!Array.isArray(order)) {
    return Response.json(
      { ok: false, error: "order must be an array of image ids" },
      { status: 400 }
    );
  }

  const statements = order.map((id, index) =>
    env.DB.prepare(
      "UPDATE images SET display_order = ? WHERE id = ?"
    ).bind(index, Number(id))
  );

  if (statements.length > 0) {
    await env.DB.batch(statements);
  }

  return Response.json({
    ok: true,
    saved: order.length,
  });
}