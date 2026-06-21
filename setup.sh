#!/bin/bash

# Make all shell scripts executable
chmod +x smart_greenshouse.sh
chmod +x force_stop_greenhouse.sh
chmod +x dev.sh

echo "✓ Made shell scripts executable"
echo ""
echo "You can now run:"
echo "  ./smart_greenshouse.sh     - Start all services"
echo "  ./force_stop_greenhouse.sh - Stop all services"
echo "  ./dev.sh                   - Development mode (auto-reload)"
