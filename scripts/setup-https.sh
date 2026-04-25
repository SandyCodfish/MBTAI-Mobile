#!/usr/bin/env bash
# Generate a locally-trusted HTTPS cert for the dev server using mkcert.
# Why: Safari/Chrome require HTTPS for navigator.geolocation when serving
# a non-localhost host. This makes phones on your LAN trust the dev cert.
set -euo pipefail

if ! command -v mkcert >/dev/null 2>&1; then
  echo "mkcert not installed. On macOS: brew install mkcert nss" >&2
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CERT_DIR="$REPO_ROOT/certs"
mkdir -p "$CERT_DIR"

# Detect this machine's primary LAN IP (best-effort; user can append more).
LAN_IP="$(ipconfig getifaddr en0 2>/dev/null || true)"

mkcert -install
( cd "$CERT_DIR" && mkcert \
    -key-file key.pem -cert-file cert.pem \
    localhost 127.0.0.1 ::1 ${LAN_IP:+"$LAN_IP"} )

echo
echo "Cert written to $CERT_DIR/{cert,key}.pem"
echo "Run with: MBTAI_HTTPS=1 npm run dev:all"
