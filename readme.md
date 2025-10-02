# CashMoo

**Simple and private personal finance control.**

CashMoo is a desktop application for managing your personal finances with complete privacy. All your data stays on your computer. Nothing is sent to the internet.

## Quick Start

### Requirements

- **Node.js 16+** ([download here](https://nodejs.org));
- **Windows 10+**, **macOS 10.14+**, or **Linux Ubuntu 18.04+**.

### Installation

```bash
# Clone repository
git clone https://github.com/luxonauta/cashmoo
cd cashmoo

# Install dependencies
npm install

# Run application
npm start
```

On first run, CashMoo will guide you through the initial setup.

## Available Scripts

```bash
npm start              # Run application
npm run start:dev      # Run with detailed logging
npm run build:all      # Build for all platforms (Windows, macOS, Linux)
npm run build          # Build executable for current platform
npm run build:win      # Build for Windows
npm run build:mac      # Build for macOS
npm run build:linux    # Build for Linux
```

## Data Storage

Your financial data is stored locally at:

- **Windows**: `%APPDATA%\cashmoo\data\`;
- **macOS**: `~/Library/Application Support/cashmoo/data/`;
- **Linux**: `~/.config/cashmoo/data/`.

## Troubleshooting

### App won't start

1. Check Node.js: `node --version` (must be `16+`);
2. Run with logs: `npm run start:dev`;
3. Check console errors and file permissions.

### Notifications not working

- **Windows**: Settings > System > Notifications and enable;
- **macOS**: System Preferences > Notifications and enable for CashMoo;
- **Linux**: Install `libnotify-bin` if needed.

### Permission issues

Run terminal as administrator or verify write access to user data folder.

## Custom Icons

To use your own icon, place a PNG file (`512x512px` or larger) at `assets/icon.png` and restart the app.

## Project Structure

```
cashmoo/
├── app/
│   ├── helpers/          # Utility functions
│   └── renderer/         # User interface
├── assets/               # Icons and resources
├── main.js               # Electron main process
├── preload.js            # Security preload script
└── package.json          # Configuration and dependencies
```

## Contributing

1. Fork the project;
2. Create feature branch: `git checkout -b feature/new-feature`;
3. Commit changes: `git commit -m 'Add new feature'`;
4. Push to branch: `git push origin feature/new-feature`;
5. Open Pull Request.

## License

MIT License. See [LICENSE](LICENSE) file for details.
