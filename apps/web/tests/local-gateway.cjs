const http = require("node:http");
const crypto = require("node:crypto");
const secret = "close-ai-local-testing-secret-at-least-32-chars";
function jwt(role) {
  const head = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" }),
  ).toString("base64url");
  const body = Buffer.from(
    JSON.stringify({
      role,
      iss: "supabase",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400,
    }),
  ).toString("base64url");
  return (
    head +
    "." +
    body +
    "." +
    crypto
      .createHmac("sha256", secret)
      .update(head + "." + body)
      .digest("base64url")
  );
}
if (require.main === module)
  http
    .createServer((req, res) => {
      const auth = req.url.startsWith("/auth/v1");
      const rest = req.url.startsWith("/rest/v1");
      if (!auth && !rest) {
        res.writeHead(404);
        return res.end();
      }
      const upstream = http.request(
        {
          hostname: "127.0.0.1",
          port: auth ? 59999 : 53000,
          path: req.url.replace(auth ? "/auth/v1" : "/rest/v1", "") || "/",
          method: req.method,
          headers: req.headers,
        },
        (response) => {
          res.writeHead(response.statusCode, response.headers);
          response.pipe(res);
        },
      );
      upstream.on("error", () => {
        res.writeHead(503);
        res.end();
      });
      req.pipe(upstream);
    })
    .listen(54321, "127.0.0.1", () =>
      process.stdout.write("Local Supabase gateway ready\n"),
    );
module.exports = { jwt };
