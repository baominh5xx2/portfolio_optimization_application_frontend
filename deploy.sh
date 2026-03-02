#!/bin/bash

echo "========================================"
echo "  FinBot Frontend Deploy Script"
echo "========================================"
echo ""

echo "[1/2] Building frontend..."
cd "$(dirname "$0")"
npm run build

if [ $? -ne 0 ]; then
    echo "Build failed!"
    read -p "Press Enter to exit..."
    exit 1
fi

echo ""
echo "[2/2] Build completed!"
echo ""
echo "========================================"
echo "  Deployment Info"
echo ""
echo "Static files are in: dist/"
echo ""
echo "To preview locally:"
echo "  npm run preview"
echo ""
echo "To serve with any static server:"
echo "  npx serve dist"
echo ""
echo "Or use Python:"
echo "  python -m http.server 8080 --directory dist"
echo ""
read -p "Press Enter to exit..."
