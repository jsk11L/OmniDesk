# HTTPS setup (Let's Encrypt)

The stack ships HTTP-only so `docker compose up` works out of the box. TLS is an
explicit opt-in step: OmniDesk does **not** bundle Certbot as a service — you run
it on the host and the edge nginx reads the certs from the mounted `certs` volume.

## 1. Point DNS

Create an `A`/`AAAA` record for your domain → the host's public IP. Set
`FRONTEND_URL=https://your-domain.example` in `.env`.

## 2. Obtain the certificate (webroot mode)

The edge nginx already serves `/.well-known/acme-challenge/` from the
`certbot_webroot` volume. With the stack running on port 80:

```bash
docker run --rm \
  -v omnidesk_certs:/etc/letsencrypt \
  -v omnidesk_certbot_webroot:/var/www/certbot \
  certbot/certbot certonly --webroot -w /var/www/certbot \
  -d your-domain.example --email you@example.com --agree-tos --no-eff-email
```

(Replace the volume prefix `omnidesk_` if your `COMPOSE_PROJECT_NAME` differs.)

## 3. Enable the HTTPS server block

Edit `infra/nginx.conf`: comment out the plain port-80 `server { … }` app block,
and uncomment the HTTP→HTTPS redirect + the `listen 443 ssl` block, replacing
`your-domain.example` in the `ssl_certificate*` paths. Then:

```bash
docker compose restart nginx
curl -f https://your-domain.example/api/health
```

## 4. Auto-renew

```cron
0 4 * * * docker run --rm -v omnidesk_certs:/etc/letsencrypt -v omnidesk_certbot_webroot:/var/www/certbot certbot/certbot renew --webroot -w /var/www/certbot && docker compose -f /opt/omnidesk/docker-compose.yml restart nginx
```
