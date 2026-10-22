# ip

En liten «hva er IP-adressen min»-side (Express + React/Vite, ingen database).

## Drift

Appen kjører på [apphost.no](https://apphost.no) som en rootless Podman-pod.
Deploy skjer via `git push` til repoet, etterfulgt av en rebuild på apphost.
Persistent data ligger i `/data` i poden.
