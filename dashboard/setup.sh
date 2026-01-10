#!/bin/bash
# Miami Beach Resort Project - Quick Setup Script

echo '🏨 Miami Beach Resort Project Setup'
echo '===================================='

# Check if repos exist
if [ ! -d "dashboard" ]; then
    echo '📥 Cloning dashboard repository...'
    git clone https://github.com/monjur-hbl/calender-miami-test.git dashboard
else
    echo '✅ Dashboard already exists'
fi

if [ ! -d "hk-api" ]; then
    echo '📥 Cloning HK API repository...'
    git clone https://github.com/monjur-hbl/hk-api.git hk-api
else
    echo '✅ HK API already exists'
fi

echo ''
echo '📁 Project Structure:'
echo '  ./dashboard/     - Web dashboard (GitHub Pages)'
echo '  ./hk-api/        - Backend API (Cloud Run)'
echo '  ./docs/          - Documentation'
echo '  ./credentials/   - Access keys (keep secure!)'
echo ''
echo '🚀 Ready to use Claude Code!'
echo '   Run: claude'
echo ''
echo '📋 Current Priority: Fix stats bug (10x inflation)'
echo '   See: docs/CURRENT_BUG.md'

