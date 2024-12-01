/**
 * HTTP Echo
 * Echos back HTTP requests in JSON, HTML, and plain text.
 */
import * as log from "jsr:@std/log";
import { pick } from "jsr:@std/collections/pick";
import { accepts } from "jsr:@std/http/negotiation";

/**
 * Environment variables
 *
 * LOG_FORMAT: "json" for structured logs, default pretty logs otherwise.
 * PORT: TCP port on which to listen (default: 9080).
 * TERSE_RESPONSE: "true" to exclude most request details from the response.
 */
const config = {
  logHandler: Deno.env.get("LOG_FORMAT") === "json" ? "json" : "default",
  logLevel: "DEBUG",
  port: parseInt(Deno.env.get("PORT")!) || 9080,
  terseResponse: Deno.env.get("TERSE_RESPONSE") === "true",
} as const;

function collapseArgs(args: unknown[]) {
  if (args.length === 0) return {};
  if (args.length > 1) return { args };
  const arg = args[0];
  return typeof arg === "object" && arg != null && !Array.isArray(arg) ? arg : { arg };
}

log.setup({
  handlers: {
    default: new log.ConsoleHandler("DEBUG", {
      formatter: (r) => `[${r.datetime.toISOString()}] ${r.levelName}: ${r.msg}`,
    }),
    json: new log.ConsoleHandler("DEBUG", {
      formatter: (r) =>
        JSON.stringify({
          time: r.datetime.toISOString(),
          level: r.levelName,
          msg: r.msg,
          ...collapseArgs(r.args),
        }),
      useColors: false,
    }),
  },
  loggers: {
    default: {
      level: config.logLevel,
      handlers: [config.logHandler],
    },
  },
});
log.info(`Logging at level ${config.logLevel}`);

function onListen({ hostname, port }: Deno.NetAddr) {
  log.info(`Listening on http://${hostname}:${port}/`, { port });
}

type SimpleRequest = {
  method: string;
  url: string;
  headers: [string, string][];
  body: string;
};

function echoJson(request: SimpleRequest) {
  const echo = { request: config.terseResponse ? pick(request, ["method", "url"]) : request };
  return JSON.stringify(echo);
}

function echoHtmlDetails(request: SimpleRequest) {
  const headerRows = request.headers.map((h) => `<tr><th>${h[0]}</th><td>${h[1]}</td></tr>`);

  return `<h2>Headers</h2>
<table>
${headerRows.join("\n")}
</table>
<h2>Body</h2>
${request.body.length == 0 ? "<p>None</p>" : `<pre>${request.body}</pre>`}
`;
}

function echoHtml(request: SimpleRequest) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<title>HTTP Echo</title>
<meta charset="utf-8">
<link rel="icon" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAABVVJREFUWEfFV1tsFGUU/s7MlsJWKAhyUcAESzARDHiD7nYKDXLR+ERiFH2AgFxeKFiMnbYoaaTdqZEK5UFBQHwwaEx8MspFUtjZmQpeIBYTCUgCKBQEudnFtjvzmZluy1J2W7AI/8tk/v/M+b851+8IbnFNrvtugBJPvCDkdBGZQLhjBDLQ+5zgJYFynGQjRfa4wcBX+4unXLkV1dKTUOG7+8Y6rlJKYq4IginyzQCyk+8tAHI6zkjERbBdVdya6JtTj3Z3R0YA+bV2P2lx3hFBMYCsTiXECQpX5QZHfHG5uek3bz83Z/gjl+NnXhTKGggeTrmwjUQds9W3GkpC19IBSQsgv9bOU1vdLwlOAHkKivQDMYTgzhYEX/pRf+qypywUMX/3nnaZNtJ7Pmn8kJuN+OcCmQXBebi8BpFRAml0+ihzGkpCx7qCuAlAqMqaKKq7C8ADBLYKeRgitSDMATnDZ3xTPNYzt7+6AvD2nqs7mn2luWk3BBrIEoqMF2ABgD/pKDPtivChVBA3AMiP2HmKOBYhQ8R1VybYZ7uqth0RoE1x+LhZUXgm9eN0ALxzrSo6wlXlZwJZjpM1LiCtc6koawU871INN5Rdt0QnAM/naqu73zO7ACtiurY+XB2tgyLLCC629cKPupovEwDfOkZ0kUA2weUGq7ywuMAwlxNYl3TH5I6Y6AQQipjviWCln1XAaRIQwTAAAQBNJJyb/CcY7qch0ZTmTAX88wSJs9J+04MAhMRau0x7w9vwt5Op9ktS+C//QJAL4D6CF0D5J20EdwPAlxf2FchgAH+T8ANXBPd7P6Uq7mNeivoAwoa5GcBCuO58q3zqJ+170Z2AzHAT6qiGVaE/0gHozgWefP4a+yEl4JwCuNvSC2f5eqv3zYOibAOwxdK118SrcGpz2xlRcCErnhizt7IokVf3dfaweP+LAI5YujYp3eWZsqCrbNgwDwIYdzZ4ddCx4udbpq2uD7QFA8fpYrCTkzVC8o3YKwr4KQDD0rWydsV7nxZRDwCywdILvEKUdvVkgXZLxuoALiOdZ+yyad8nLR4BoLuQVyVkmFuSeapZuhbzBWpi80BuI7HELtM29QZAKGIuFsFGChbYpdrHSQAFAEy/zoSN2AGAk7KuJfrvrSzygy3fiFYqkLddh882VBTu6Q2A/KrodEWVbymosku1VZ6uaavr+7b1C1wF5KCEjOh5gTRbutZZw8OR6AcQWUonMcGuKDrcGwChqvrxogYaAWy0dG1ph66wYZ4gmCNhw0wAcEmc6zgUwSAAQS9/vdTMBEB6SsP2DwPJehIn4QW2v0QwFIBy7wGkdYER+xDgkjvrAtlo6QXpXHBzEIZqzDVCVNydIIyYW0S8dpnQLL2oIw0Xgtz8/6VhfQEQMElsTVuIwjWxKSAb7kohSl+Kj2YPizddBORXSy94ojdpGDZiPwF8NGMpTlam9mYkMt8qLfCbUcgwdwgwMyGJ0ftLi3zq1XX1VIon19SPDDBwksAuW9dmp1bZzmbkbd7zduz/8Q2ERE6TTCEkbCLlNgkJVUBSCInX+ZmekPj1P4WSweXrVnnhulDEXO/RcrpcbJffJiWrji4SRTZ5tNwu05aHq6MroMj7GSlZEkSe0urYhAwmWOI6WZ/dCVKqqG0vC6RWwAtuHzWUSs8z0fKdAIbeYVp+jo4yq1ta3hHlHj1X5fpgQkHQ53aCHc3xxNxDlUWXknFzw2AycXX9wJxgYDuI2R6XFCLeOZhQmZNKxzubUqYczziaAScJVqQdzSBVAEan6Pxvo1kqqHs2nHa1TOd4Dk4XZBjPwUbi9sbzfwEUPX4TSDbkKAAAAABJRU5ErkJggg==">
<style>
/* CSS reset: https://www.joshwcomeau.com/css/custom-css-reset/ */
*, *::before, *::after {
  box-sizing: border-box;
}
* {
  margin: 0;
}
body {
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}
img, picture, video, canvas, svg {
  display: block;
  max-width: 100%;
}
input, button, textarea, select {
  font: inherit;
}
p, h1, h2, h3, h4, h5, h6 {
  overflow-wrap: break-word;
}
p {
  text-wrap: pretty;
}
h1, h2, h3, h4, h5, h6 {
  text-wrap: balance;
}
#root, #__next {
  isolation: isolate;
}
/* Custom styles */
html {
  font-family: -apple-system, BlinkMacSystemFont, "Roboto", "Segoe UI", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
  font-weight: 400;
  color: #303030;
}
body {
  margin: 1rem;
}
h1 {
  margin: 1rem 0;
  font-weight: 700;
}
h2 {
  margin: 1.5rem 0 1rem 0;
  font-weight: 600;
}
table {
  border-collapse:collapse;
}
tr:nth-child(odd) {
  background-color: #f3f3f3;
}
th {
  padding: 0.25rem;
  padding-right: 1.25rem;
  font-weight: 500;
  text-align: start;
  text-transform: capitalize;
}
td {
  padding: 0.25rem;
  word-break: break-all;
}
pre {
  width: fit-content;
  max-width: 100%;
  overflow-x: auto;
  padding: 0.25rem;
  font-family: sSFMono-Regular, Consolas, "Roboto Mono", "Droid Sans Mono", "Liberation Mono", Menlo, Courier, monospace;
  background-color: #f3f3f3;
}
.request {
  font-weight: 500;  
}
</style>
<!-- <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css"> -->
</head>
<body>
<h1>HTTP Echo</h1>
<h2>Request</h2>
<p class="request">${request.method} ${request.url}</p>
${config.terseResponse ? "" : echoHtmlDetails(request)}</body>
</html>`;
}

Deno.serve({ port: config.port, onListen }, async (req) => {
  const start = new Date();
  const absUrl = new URL(req.url);
  const url = absUrl.pathname + absUrl.search;

  const request: SimpleRequest = {
    method: req.method,
    url,
    headers: (() => {
      const result: [string, string][] = [];
      for (const header of req.headers.entries()) {
        result.push(header);
      }
      return result;
    })(),
    body: await req.text(),
  };
  log.debug("Echoing request", { request });

  const contentType = accepts(req, "application/json", "text/html") || "text/html";
  const body = contentType === "application/json" ? echoJson(request) : echoHtml(request);
  const res = new Response(body, { headers: { "Content-Type": contentType } });
  const ms = new Date().valueOf() - start.valueOf();
  const msg = `${req.method} ${url} ${res.status} - - ${ms} ms`;
  log.info(msg);
  return res;
});
