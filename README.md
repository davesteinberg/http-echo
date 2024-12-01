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

| Variable         | Description                                                |
| ---------------- | ---------------------------------------------------------- |
| `LOG_FORMAT`     | "json" for structured logs, default pretty logs otherwise. |
| `PORT`           | TCP port on which to listen (default: 9080).               |
| `TERSE_RESPONSE` | "true" to exclude most request details from the response.  |
