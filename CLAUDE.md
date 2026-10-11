# ip (`app_c10a15d21e144dfe8f6c0ab1306ee81b`)

App running on the apphost Mini-PaaS as a rootless Podman pod.
Edit on the host; the repo is bind-mounted into the pod at `/workspace`,
so host edits are live in the pod.

## Repo boundary (enforced)

This Claude session is locked to `/var/lib/paas/apps/app_c10a15d21e144dfe8f6c0ab1306ee81b/repo/`.
A PreToolUse hook blocks `Edit`/`Write`/`MultiEdit`/`NotebookEdit` on any
path outside this directory and exits 2. If you legitimately need to touch
`/opt/paas-control-plane`, `/etc`, or another app: quit this session and
start a fresh root shell without the `apps` menu.

## Publishing changes

Run `deploy`. That's it.

`deploy` does the safe sequence: `chown -R paas:paas` → `git add -A` →
commit (use `-m "msg"` to set the message) → `git push origin <branch>` →
`POST /apps/app_c10a15d21e144dfe8f6c0ab1306ee81b/rebuild` → tail build log → verify pod is running.

`deploy --no-rebuild -m "wip"` commits and pushes without triggering a
rebuild.

Do not improvise your own commit/push/rebuild sequence. The PaaS deploy
flow runs `git fetch` + `git checkout` + `git pull` against this repo on
host, and falls through to `rm -rf` + fresh clone on any conflict — so
uncommitted local edits are lost the moment a rebuild starts.

## Where things live

| Path / command | What it is |
|---|---|
| `/var/lib/paas/apps/app_c10a15d21e144dfe8f6c0ab1306ee81b/repo` | Host-side source (this directory) |
| `/workspace` (inside pod) | Same files, bind-mounted |
| `/var/lib/paas/apps/app_c10a15d21e144dfe8f6c0ab1306ee81b/data` | Persistent volume (`/data` in pod) |
| `paas_app_c10a15d21e144dfe8f6c0ab1306ee81b` | Container name |

Env vars are managed in the apphost GUI — do not hardcode secrets, do not
commit `.env` files.

## Pod inspection

```bash
su - paas -c 'podman logs --tail 200 paas_app_c10a15d21e144dfe8f6c0ab1306ee81b'
su - paas -c 'podman exec -it paas_app_c10a15d21e144dfe8f6c0ab1306ee81b sh'
su - paas -c 'podman ps --filter name=paas_app_c10a15d21e144dfe8f6c0ab1306ee81b'
```

## App-specific notes

**Hva appen er:** en liten «hva er IP-adressen min»-side på `ip.webspes.run.apphost.no` (Express + React/Vite,
ingen database). Vedlikeholdes av Webspesialisten; siden lenker til webspesialisten.no.

- **Endepunkter:** `/` (HTML, men ren tekst for curl/wget/HTTPie og `Accept: text/plain`), `/ip`, `/ipv4`, `/ipv6`,
  `/json`, `/api/ip` (siden), `/api/server-ip` (serverens utgående IP, bufret 10 min), `/api/config`.
  Ukjente `/api/*` gir 404 JSON.
- **Besøkendes IP:** `X-Real-Ip` fra Traefik (klientens egne X-Forwarded-For fjernes av Traefik). Serveren har bare
  IPv4 – IPv6 sjekkes valgfritt fra nettleseren mot api6.ipify.org.
- **Land/ASN:** DB-IP Lite (CC BY 4.0, krever kreditering i footer) lastes ned til `/data/geo` ved oppstart og
  oppdateres månedlig (`server/geo.ts`). rDNS med 1,5 s timeout og 10 min cache.
- **Personvern:** loggen inneholder ikke IP-adresser eller responsbody.
- `ALLOWED_IP` (env) viser «Autorisert tilgang» for én bestemt IP.
