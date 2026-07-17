#!/bin/bash
# Convenience alias for smart_greenshouse.sh (typo in original name)
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$DIR/smart_greenshouse.sh" "$@"
