export async function onRequestGet(context) {
  const { env, params } = context;
  const imageId = Number(params.id);

  if (!Number.isInteger(imageId) || imageId <= 0) {
    return new Response("Invalid image id", { status: 400 });
  }

  try {
    const image = await env.DB.prepare(
      "SELECT r2_key, filename FROM images WHERE id = ? LIMIT 1"
    ).bind(imageId).first();

    if (!image) {
      return new Response("Image not found in database", { status: 404 });
    }

    const object = await env.IMAGES_BUCKET.get(image.r2_key);

    if (!object) {
      return new Response("Image not found in bucket", { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);

    if (!headers.get("Content-Type")) {
      const name = (image.filename || "").toLowerCase();

      if (name.endsWith(".png")) headers.set("Content-Type", "image/png");
      else if (name.endsWith(".jpg") || name.endsWith(".jpeg")) headers.set("Content-Type", "image/jpeg");
      else if (name.endsWith(".webp")) headers.set("Content-Type", "image/webp");
      else if (name.endsWith(".gif")) headers.set("Content-Type", "image/gif");
      else if (name.endsWith(".bmp")) headers.set("Content-Type", "image/bmp");
      else if (name.endsWith(".tiff") || name.endsWith(".tif")) headers.set("Content-Type", "image/tiff");
      else headers.set("Content-Type", "application/octet-stream");
    }

    headers.set("Cache-Control", "no-cache");
    if (object.httpEtag) {
      headers.set("ETag", object.httpEtag);
    }

    return new Response(object.body, {
      status: 200,
      headers
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: String(error)
      }, null, 2),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}