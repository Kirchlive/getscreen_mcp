# GetScreen MCP Server

A lightweight Model Context Protocol (MCP) Server for rapid capture of screenshots from all available monitors with automatic compression.

## Features

- **Multi-Monitor Support**: Automatically captures all connected displays
- **WSL Support**: Works seamlessly in Windows WSL through PowerShell integration
- **Fast Compression**: Utilizes Sharp for optimal JPEG compression
- **Simple Integration**: Single tool with optional parameters
- **Lightweight**: Minimal dependencies, maximum performance
- **Cross-Platform**: Linux, macOS, and Windows (including WSL)

## New Features

### Enhanced WSL Support

WSL support has been improved with automatic detection and PowerShell integration. The tool now works seamlessly whether you use the `wsl` command approach or the simpler Node-based direct execution method.

**Key Features:**
- Automatic WSL detection via `/proc/version` environment inspection
- Seamless PowerShell integration for capturing Windows host displays
- Support for both direct Node execution and WSL command wrapper
- No additional configuration needed for WSL environment detection

**How It Works:**
When running in WSL, the tool automatically detects the environment and leverages PowerShell on the Windows host to capture screenshots. This approach ensures access to all display information from the Windows side while maintaining full compatibility with WSL-based tools.

## Installation

```bash
git clone https://github.com/Kirchlive/getscreen_mcp.git
cd getscreen_mcp
npm install
npm run build
```

## Configuration

### Claude Code

Add the following to your Claude configuration:

**macOS**: 
`~/Users/USERNAME/.claude.json`
**Windows**: 
`C:\Users\USERNAME\.claude.json`
**Linux/WSL**: 
`~/home/USERNAME/.claude.json`

```json
{
  "mcpServers": {
    "getscreen": {
      "command": "node",
      "args": ["/ABSOLUT/PATH/TO/getscreen_mcp/build/index.js"]
    }
  }
}
```

## Usage

### Screenshot Tool

The `screenshot` tool captures all available monitors and returns the compressed images.

**Parameters** (all optional):
- `quality` (number, 1-100): JPEG quality. Default: 80
- `maxWidth` (number): Maximum width in pixels. Images are resized proportionally.

**Examples**:

```
Take a screenshot
```

```
Take a screenshot with high quality (quality: 95)
```

```
Take a screenshot and resize it to max. 1920px width (maxWidth: 1920)
```

## Technical Details

### Platform Detection
The tool automatically detects the environment and selects the optimal method:
- **WSL**: Uses PowerShell on the Windows host via `powershell.exe`
- **Linux/macOS**: Uses `screenshot-desktop` for native capture

### Components
- **WSL Capture**: PowerShell System.Windows.Forms and System.Drawing
- **Native Capture**: `screenshot-desktop` for Linux/macOS
- **Compression**: `sharp` for fast image processing and JPEG compression
- **Format**: Images are returned as base64-encoded JPEGs
- **Performance**: Parallel capture of all monitors for maximum speed

### WSL Implementation
In WSL environments:
1. Detection via `/proc/version` (checks for "microsoft" or "WSL")
2. PowerShell script is executed on Windows host
3. All monitors are captured via `System.Windows.Forms.Screen::AllScreens`
4. Screenshots captured as PNG, then compressed to JPEG with desired quality
5. Base64-encoded transmission back to WSL

## License

MIT
