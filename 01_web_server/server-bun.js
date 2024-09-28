import { serve } from "bun";

serve({
  fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      return new Response("Hello, World!", { status: 200 });
    } else if (url.pathname === "/ice-tea") {
      return new Response("Ice Tea is Cool 😂!", { status: 200 });
    } else {
      return new Response("Not Found", { status: 404 });
    }
  },
  port: 3000,
  hostname: "localhost",
});
