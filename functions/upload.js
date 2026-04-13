export async function onRequestGet(context) {
  return context.env.ASSETS.fetch(new Request(new URL("/upload.html", context.request.url)));
}