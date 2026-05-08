#!/bin/bash
# Start Expo and automatically select "Proceed anonymously" after the prompt appears.
# The { sleep N; printf ...; } pipe sends a down-arrow + enter to stdin after a delay,
# which moves the cursor from "Log in" to "Proceed anonymously" and confirms.
{
  sleep 12
  printf "\033[B\n"
} | EXPO_PACKAGER_PROXY_URL="https://$REPLIT_EXPO_DEV_DOMAIN" \
    EXPO_PUBLIC_DOMAIN="$REPLIT_DEV_DOMAIN" \
    EXPO_PUBLIC_REPL_ID="$REPL_ID" \
    REACT_NATIVE_PACKAGER_HOSTNAME="$REPLIT_DEV_DOMAIN" \
    pnpm exec expo start --localhost --port "$PORT" --clear
