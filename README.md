# Hawaii Disco for Obsidian

Browse your [Hawaii Disco](https://github.com/ongyjho/hawaiidisco) RSS articles inside Obsidian. Read curated articles with AI insights and save them as permanent notes in your vault.

## Why?

RSS feeds produce noise. Hawaii Disco is a TUI app that helps you read, filter, and bookmark articles with AI-powered insights. This plugin connects that curated output to your Obsidian vault — so only the articles you've already read and judged valuable become notes.

```
Feeds → Hawaii Disco (read, filter, bookmark, AI insights)
            ↓
    Obsidian Plugin (reads HD's database)
            ↓
    Your vault: only curated knowledge
```

Unlike in-Obsidian RSS readers that pull every article into your vault, this plugin acts as a **gatekeeper** — keeping your vault clean while still connecting it to your information flow.

## Features

### Article Browser
- Sidebar view with all your HD articles
- Filter by: All / Bookmarked / Unread
- Filter by feed, search by keyword
- Click any article to create an Obsidian note

### Notes with Context
Every note includes what HD already processed:
- Original article summary
- AI-generated insight (if available)
- Translation (if available)
- Your bookmark tags and memo
- YAML frontmatter for Dataview/graph compatibility

### Digest View
- Browse cached digests from Hawaii Disco
- Generate new AI digests directly from the plugin (requires Anthropic API key)
- Save digests as Obsidian notes

## Requirements

- [Hawaii Disco](https://github.com/ongyjho/hawaiidisco) installed and running (this plugin reads its SQLite database)
- Obsidian desktop app (not available on mobile — requires filesystem access)

## Installation

### From Community Plugins
1. Open Obsidian Settings → Community plugins → Browse
2. Search for "Hawaii Disco"
3. Install and enable

### Manual Installation
1. Download `main.js`, `manifest.json`, `styles.css`, and `sql-wasm.wasm` from the [latest release](https://github.com/ongyjho/hawaiidisco-obsidian/releases)
2. Create folder: `{vault}/.obsidian/plugins/hawaiidisco-obsidian/`
3. Copy all four files into that folder
4. Restart Obsidian and enable the plugin in Settings → Community plugins

## Setup

1. Open Settings → Hawaii Disco
2. Set **Database path** (default: `~/.local/share/hawaiidisco/hawaiidisco.db`)
3. Click **Test** to verify connection
4. (Optional) Set Anthropic API key for digest generation
5. Configure notes folder, tags prefix, and other preferences

## Usage

- Click the **RSS icon** in the ribbon to open the article list
- Use **Command palette** → "Hawaii Disco: Open article list" or "Open digest view"
- Click any article to create/open its note in your vault
- Use the **Refresh** button to reload the database after using Hawaii Disco

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| Database path | `~/.local/share/hawaiidisco/hawaiidisco.db` | Path to HD's SQLite database |
| Anthropic API key | — | For generating new digests |
| AI model | Claude Sonnet 4.5 | Model for digest generation |
| Notes folder | `hawaii-disco` | Folder in vault for created notes |
| Tags prefix | `hawaiidisco` | Prefix for frontmatter tags |
| Period days | 7 | Days to include in digest |
| Max articles | 20 | Max articles in digest prompt |
| Include insight | On | Add AI insight section to notes |
| Include translation | On | Add translation section to notes |

## How It Works

This plugin uses [sql.js](https://github.com/sql-js/sql.js) (SQLite compiled to WebAssembly) to read Hawaii Disco's database file in **read-only mode**. It never writes to the database. The database is loaded as an in-memory snapshot and refreshed on demand.

## License

MIT
