#!/bin/bash
# Start Expo dev server.
# Uses a pipe so Expo detects a non-interactive terminal and skips
# interactive keyboard shortcuts, then auto-answers the "Proceed anonymously"
# login prompt each time it appears by repeatedly sending down-arrow + enter.
(while true; do sleep 5; printf "\033[B\n"; done) | \
  EXPO_PACKAGER_PROXY_URL="https://$REPLIT_EXPO_DEV_DOMAIN" \
  EXPO_PUBLIC_DOMAIN="$REPLIT_DEV_DOMAIN" \
  EXPO_PUBLIC_REPL_ID="$REPL_ID" \
  REACT_NATIVE_PACKAGER_HOSTNAME="$REPLIT_DEV_DOMAIN" \
  pnpm exec expo start --localhost --port "$PORT"
