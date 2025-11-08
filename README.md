# GetScreen MCP Server

Ein leichtgewichtiger Model Context Protocol (MCP) Server für die schnelle Erfassung von Screenshots aller verfügbaren Monitore mit automatischer Kompression.

## Features

- **Multi-Monitor Support**: Erfasst automatisch alle angeschlossenen Displays
- **WSL-Unterstützung**: Funktioniert nahtlos in Windows WSL durch PowerShell-Integration
- **Schnelle Kompression**: Nutzt Sharp für optimale JPEG-Kompression
- **Einfache Integration**: Ein einziges Tool mit optionalen Parametern
- **Lightweight**: Minimale Dependencies, maximale Performance
- **Plattformübergreifend**: Linux, macOS und Windows (inkl. WSL)

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
**Linux**: `~/.config/Claude/claude_desktop_config.json`

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

### Windows WSL Konfiguration

Wenn du Claude Desktop auf Windows verwendest und das MCP in WSL ausführst:

```json
{
  "mcpServers": {
    "getscreen": {
      "command": "wsl",
      "args": [
        "-d", "Ubuntu",
        "node",
        "/home/username/getscreen_mcp/build/index.js"
      ]
    }
  }
}
```

**Wichtig für WSL**:
- Ersetze `Ubuntu` mit dem Namen deiner WSL-Distribution (siehe `wsl -l`)
- Verwende den Linux-Pfad innerhalb von WSL (z.B. `/home/username/...`)
- Das Tool erkennt automatisch WSL und nutzt PowerShell für Screenshots vom Windows-Host
- PowerShell muss auf dem Windows-Host verfügbar sein (standardmäßig installiert)

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

### Plattform-Erkennung
Das Tool erkennt automatisch die Umgebung und wählt die optimale Methode:
- **WSL**: Nutzt PowerShell auf dem Windows-Host via `powershell.exe`
- **Linux/macOS**: Verwendet `screenshot-desktop` für native Erfassung

### Komponenten
- **Erfassung WSL**: PowerShell System.Windows.Forms und System.Drawing
- **Erfassung Native**: `screenshot-desktop` für Linux/macOS
- **Kompression**: `sharp` für schnelle Bildverarbeitung und JPEG-Kompression
- **Format**: Bilder werden als base64-kodierte JPEGs zurückgegeben
- **Performance**: Parallele Erfassung aller Monitore für maximale Geschwindigkeit

### WSL-Implementierung
In WSL-Umgebungen:
1. Erkennung über `/proc/version` (prüft auf "microsoft" oder "WSL")
2. PowerShell-Skript wird auf Windows-Host ausgeführt
3. Alle Monitore werden über `System.Windows.Forms.Screen::AllScreens` erfasst
4. Screenshots als PNG erfasst, dann zu JPEG mit gewünschter Qualität komprimiert
5. Base64-kodierte Übertragung zurück ins WSL

## Lizenz

MIT
