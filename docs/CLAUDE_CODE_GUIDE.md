# How to Use Claude Code for This Project

## What is Claude Code?
Claude Code is a command-line tool that lets you work with Claude directly in your terminal for coding tasks. It can read files, make edits, run commands, and help you build features.

## Installation

### Option 1: Via npm (Recommended)
```bash
npm install -g @anthropic-ai/claude-code
```

### Option 2: Via Homebrew (Mac)
```bash
brew install claude-code
```

## Setup

### 1. Get API Key
You need an Anthropic API key. Get one from:
https://console.anthropic.com/

### 2. Set Environment Variable
```bash
# Add to ~/.zshrc or ~/.bashrc
export ANTHROPIC_API_KEY='your-api-key-here'

# Reload shell
source ~/.zshrc
```

### 3. Verify Installation
```bash
claude --version
```

## Using Claude Code with This Project

### 1. Navigate to Project
```bash
cd ~/Desktop/miami-beach-resort-project
```

### 2. Clone Repositories (if not done)
```bash
git clone https://github.com/monjur-hbl/calender-miami-test.git dashboard
git clone https://github.com/monjur-hbl/hk-api.git hk-api
```

### 3. Start Claude Code
```bash
claude
```

### 4. Give Context
When Claude Code starts, tell it about the project:
```
I'm working on the Miami Beach Resort hotel management system.
The dashboard is in ./dashboard/index.html
The backend API is in ./hk-api/server.js

Current issue: Dashboard stats are showing 10x inflated numbers.
See docs/CURRENT_BUG.md for details.
```

## Example Commands in Claude Code

### Read a file
```
Read the index.html file and find where allRooms is constructed
```

### Make an edit
```
Fix the bug in the stats calculation - allRooms has duplicates
```

### Run tests
```
Run curl to test the API endpoint
```

### Commit changes
```
Commit the fix with message 'Fix: Remove duplicate room entries in stats calculation'
```

## Tips for This Project

1. **Always test locally first** - The dashboard is a single HTML file, just open in browser

2. **Check the DEVELOPMENT_RULES.md** - Important rules about React hooks

3. **Use the credentials file** - Has all API keys and endpoints

4. **Reference the architecture** - Understand how pieces connect

5. **Keep credentials separate** - This project has its own credentials, don't mix with others

## Project-Specific Context to Give Claude Code

When starting a session, share this context:
```
Project: Miami Beach Resort Hotel Management System
Location: Cox's Bazar, Bangladesh
Dashboard: React single-file app on GitHub Pages
Backend: Node.js/Express on Google Cloud Run
Database: Firestore (hk-miami)
Property API: Beds24 (via proxy)

Key files:
- dashboard/index.html - Main web app
- hk-api/server.js - Backend API

Current priority: Fix stats calculation bug (10x inflation)

Important rules:
- Never use useState in conditionals/callbacks
- Never show 'Beds24' in UI
- Use deposit field for payment tracking
```

## Troubleshooting

### Claude Code not found
```bash
# Check if installed
which claude

# Reinstall
npm install -g @anthropic-ai/claude-code
```

### API key issues
```bash
# Verify key is set
echo $ANTHROPIC_API_KEY

# Should show your key (starting with sk-ant-)
```

### Permission errors
```bash
# Make sure you can write to the directory
chmod -R u+w ~/Desktop/miami-beach-resort-project
```

