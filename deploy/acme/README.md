# ACME HTTPS / Custom Domain Provisioning

**Entity: Darrel-spell-living-trust**

## Cloudflare (preferred)
- Orange-cloud proxy = automatic SSL (Universal SSL + Advanced Certificate Manager if needed)
- No cert-manager required
- Force HTTPS via Dashboard → SSL/TLS → Always Use HTTPS + Automatic HTTPS Rewrites

## Kubernetes + cert-manager (for kimi-cloud self-host)

1. Install cert-manager:
```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.15.0/cert-manager.yaml
```

2. Apply ClusterIssuer + Certificate + Ingress (see manifests in this folder)

3. DNS A/AAAA or CNAME must point to the Ingress LoadBalancer / NodePort before ACME challenge succeeds.

## Verification
```bash
curl -I https://api.rotationtv.network/api/kimi/health
curl -I https://app.rotationtv.network
```
