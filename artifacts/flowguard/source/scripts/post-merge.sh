#!/usr/bin/env bash
set -euo pipefail

npm ci --no-audit --no-fund
npm test
