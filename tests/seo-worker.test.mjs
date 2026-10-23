import test from "node:test";
import assert from "node:assert/strict";
import worker from "../seo-worker.mjs";

const forbiddenFetch = { ASSETS: { fetch() { throw new Error("Redirect must precede asset lookup"); } } };

test("canonical and equivalent legacy URLs redirect once, preserving queries", async () => {
  for (const host of ["avtocomplex15.kz", "www.avtocomplex15.kz"]) {
    for (const protocol of ["http", "https"]) {
      for (const path of ["/home", "/home/", "/geometry", "/geometry/", "/index", "/index.html"]) {
        const r = await worker.fetch(new Request(`${protocol}://${host}${path}?utm_source=test`), forbiddenFetch);
        assert.equal(r.status, 301);
        assert.equal(r.headers.get("Location"), "https://avtocomplex15.kz/?utm_source=test");
      }
    }
  }
  const r = await worker.fetch(new Request("http://www.avtocomplex15.kz/protochka?ref=test"), forbiddenFetch);
  assert.equal(r.headers.get("Location"), "https://avtocomplex15.kz/protochka?ref=test");
});

test("canonical home remains indexable and passes the request to assets unchanged", async () => {
  const request = new Request("https://avtocomplex15.kz/");
  const r = await worker.fetch(request, { ASSETS: { async fetch(received) {
    assert.equal(received, request);
    return new Response("home", { headers: { "Content-Type": "text/html", "Cache-Control": "public, max-age=0, must-revalidate" } });
  } } });
  assert.equal(r.status, 200);
  assert.equal(await r.text(), "home");
  assert.equal(r.headers.get("X-Robots-Tag"), null);
  assert.equal(r.headers.get("Content-Type"), "text/html; charset=utf-8");
});

test("retired services and arbitrary missing URLs keep genuine 404 responses", async () => {
  for (const path of ["/protochka", "/zapchasti", "/oil", "/omsk", "/missing/nested"]) {
    const r = await worker.fetch(new Request(`https://avtocomplex15.kz${path}`), {
      ASSETS: { async fetch() { return new Response("not found", { status: 404 }); } }
    });
    assert.equal(r.status, 404);
    assert.equal(r.headers.get("Location"), null);
    assert.equal(r.headers.get("X-Robots-Tag"), "noindex");
  }
});

test("cache headers apply only to successful visual and interface assets", async () => {
  for (const [path, status, expected] of [["/assets/hero.webp",200,"public, max-age=86400"],["/style.css",200,"public, max-age=3600"],["/script.js",200,"public, max-age=3600"],["/config.js",200,null],["/assets/missing.webp",404,null]]) {
    const r = await worker.fetch(new Request(`https://avtocomplex15.kz${path}`), { ASSETS: { async fetch() { return new Response("asset", { status }); } } });
    assert.equal(r.headers.get("Cache-Control"), expected);
  }
});

test("technical preview domains are excluded without noindex on production", async () => {
  const r = await worker.fetch(new Request("https://preview.example.workers.dev/"), { ASSETS: { async fetch() { return new Response("preview"); } } });
  assert.equal(r.headers.get("X-Robots-Tag"), "noindex");
});

test("direct error-document variants return the document with status 404", async () => {
  for (const path of ["/404", "/404/", "/404.html"]) {
    const r = await worker.fetch(new Request(`https://avtocomplex15.kz${path}`), { ASSETS: { async fetch(request) {
      assert.equal(new URL(request.url).pathname, "/404");
      return new Response("error document", { status: 200 });
    } } });
    assert.equal(r.status, 404);
    assert.equal(await r.text(), "error document");
  }
});
