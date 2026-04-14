export async function onRequestGet(context) {
  return context.env.ASSETS.fetch(new Request(new URL("/music.html", context.request.url)));
}