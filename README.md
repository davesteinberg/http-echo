# HTTP Echo

A simple HTTP server that echos back requests in JSON, HTML, and plain text.
Written in TypeScript to run on the Deno runtime.

## Quick start

To run:

```
deno task start
```

To run in development mode (with restart on change enabled):

```
deno task dev
```

## Configuration

The echo server is configurable via environment variables.

| Variable         | Description                                                                       |
| ---------------- | --------------------------------------------------------------------------------- |
| `LOG_FORMAT`     | "json" for structured logs, default pretty logs otherwise.                        |
| `LOG_LEVEL`      | Minimum level to log, one "DEBUG" (default), "INFO", "WARN", "ERROR", "CRITICAL". |
| `PORT`           | TCP port on which to listen (default: 9080).                                      |
| `TERSE_RESPONSE` | "true" to exclude most request details from the response.                         |

## Image build

A [Dockerfile](./Dockerfile) is provided to build a container image on the latest Alpine-based official [Deno image](https://hub.docker.com/r/denoland/deno).

To build and run with Podman:

```
podman build -t http-echo:0.1.0 .
podman run -it -p 9080:9080 http-echo:0.1.0
```
