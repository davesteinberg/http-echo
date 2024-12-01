FROM docker.io/denoland/deno:alpine
EXPOSE 9080
ENV PORT=9080
ENV LOG_FORMAT=json
WORKDIR /app
COPY main.ts deno.lock ./
RUN deno install --frozen --entrypoint main.ts
USER deno
CMD ["run", "--cached-only", "--allow-net", "--allow-env", "main.ts"]
