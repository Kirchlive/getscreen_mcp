# GetScreen MCP Server

Ein leichtgewichtiger Model Context Protocol (MCP) Server für die schnelle Erfassung von Screenshots aller verfügbaren Monitore mit automatischer Kompression.

## Features

- **Multi-Monitor Support**: Erfasst automatisch alle angeschlossenen Displays
- **Schnelle Kompression**: Nutzt Sharp für optimale JPEG-Kompression
- **Einfache Integration**: Ein einziges Tool mit optionalen Parametern
- **Lightweight**: Minimale Dependencies, maximale Performance

## Installation

```bash
npm install
npm run build
```

## Konfiguration

### Claude Desktop

Füge folgendes zu deiner Claude Desktop Konfiguration hinzu:

**MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "getscreen": {
      "command": "node",
      "args": ["/absolute/path/to/getscreen_mcp/build/index.js"]
    }
  }
}
```

## Verwendung

### Screenshot Tool

Das `screenshot` Tool erfasst alle verfügbaren Monitore und gibt die komprimierten Bilder zurück.

**Parameter** (alle optional):
- `quality` (number, 1-100): JPEG-Qualität. Standard: 80
- `maxWidth` (number): Maximale Breite in Pixeln. Bilder werden proportional verkleinert.

**Beispiele**:

```
Nimm einen Screenshot auf
```

```
Nimm einen Screenshot mit hoher Qualität auf (quality: 95)
```

```
Nimm einen Screenshot auf und verkleinere ihn auf max. 1920px Breite (maxWidth: 1920)
```

## Technische Details

- **Erfassung**: `screenshot-desktop` für plattformübergreifende Screenshot-Funktionalität
- **Kompression**: `sharp` für schnelle Bildverarbeitung und JPEG-Kompression
- **Format**: Bilder werden als base64-kodierte JPEGs zurückgegeben
- **Performance**: Parallele Erfassung aller Monitore für maximale Geschwindigkeit

## Lizenz

MIT
