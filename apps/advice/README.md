# Advice

Development

```sh
pnpm run dev
pnpm run dev:client
```

To build & run an actual container locally:

```sh
podman build -f ../../Dockerfile -t wooordle-advice ../..
podman run -p 8080:8080 wooordle-advice
podman run -it --rm wooordle-advice /bin/bash
```
