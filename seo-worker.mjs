const canonicalOrigin = "https://avtocomplex15.kz";
const productionHosts = new Set(["avtocomplex15.kz", "www.avtocomplex15.kz"]);

// Only the former home and the equivalent wheel-alignment service move to /.
// Unrelated retired services and unknown URLs retain a real 404 response.
const homeAliases = new Set([
  "/home", "/home/", "/geometry", "/geometry/", "/index", "/index.html"
]);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const isProduction = productionHosts.has(url.hostname);
    const isHomeAlias = homeAliases.has(url.pathname);

    // Combine hostname, protocol and legacy-path normalization in one hop.
    if (isProduction && (url.origin !== canonicalOrigin || isHomeAlias)) {
      const target = new URL(canonicalOrigin);
      target.pathname = isHomeAlias ? "/" : url.pathname;
      target.search = url.search;
      return Response.redirect(target.href, 301);
    }
    if (isHomeAlias) {
      url.pathname = "/";
      return Response.redirect(url.href, 301);
    }

    const isErrorDocument = ["/404", "/404.html", "/404/"].includes(url.pathname);
    const assetRequest = isErrorDocument
      ? new Request(new URL("/404", url), request)
      : request;
    const asset = await env.ASSETS.fetch(assetRequest);
    const response = new Response(asset.body, asset);
    // A direct visit to the error document must not become an indexed page.
    if (isErrorDocument) {
      return new Response(response.body, {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex" }
      });
    }
    if (response.headers.get("Content-Type")?.startsWith("text/html")) {
      response.headers.set("Content-Type", "text/html; charset=utf-8");
    }
    if (response.status === 404 || url.hostname.endsWith(".workers.dev")) {
      response.headers.set("X-Robots-Tag", "noindex");
    }
    if (response.status === 200) {
      if (url.pathname.startsWith("/assets/") || url.pathname === "/favicon.png") {
        response.headers.set("Cache-Control", "public, max-age=86400");
      } else if (["/style.css", "/script.js"].includes(url.pathname)) {
        response.headers.set("Cache-Control", "public, max-age=3600");
      }
    }
    return response;
  }
};
