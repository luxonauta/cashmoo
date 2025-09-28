# CashMoo

Personal finance control application built with Electron.

## System Requirements

- **Node.js**: Version 16.0.0 or higher
- **Operating System**:
  - Windows 10 or higher
  - macOS 10.14 or higher
  - Linux (Ubuntu 18.04+, Fedora 28+)

## Installation

### 1. Check Node.js

Open terminal and run:

```bash
node --version
npm --version
```

If Node.js is not installed, download from: [https://nodejs.org](https://nodejs.org).

### 2. Clone Repository

```bash
git clone https://github.com/luxonauta/cashmoo
cd cashmoo
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Setup Application Icons

Create the `assets/` folder in the project root and add the required icon files:

```
cashmoo/
├── assets/
│   ├── icon.ico     # Windows icon (256x256px)
│   ├── icon.icns    # macOS icon (512x512px)
│   └── icon.png     # Linux icon (512x512px)
└── ...
```

#### Generating Icons from a Source Image

If you have a source PNG image, you can generate the required formats:

**For Windows (.ico)**:

- Use online tools like: [https://convertico.com](https://convertico.com);
- Or use ImageMagick: `magick icon.png -resize 256x256 icon.ico`.

**For macOS (.icns)**:
Use the `iconutil` utility on macOS:

```bash
mkdir icon.iconset

sips -z 16 16     icon.png --out icon.iconset/icon_16x16.png
sips -z 32 32     icon.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32     icon.png --out icon.iconset/icon_32x32.png
sips -z 64 64     icon.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128   icon.png --out icon.iconset/icon_128x128.png
sips -z 256 256   icon.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256   icon.png --out icon.iconset/icon_256x256.png
sips -z 512 512   icon.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512   icon.png --out icon.iconset/icon_512x512.png
sips -z 1024 1024 icon.png --out icon.iconset/icon_512x512@2x.png

iconutil -c icns icon.iconset
```

**For Linux (.png)**:

- Use a `512x512px` PNG image;

#### Verifying Icon Files

Ensure the files exist and have correct sizes:

```bash
ls -la assets/
# Should show: icon.ico, icon.icns, icon.png
```

## Running the Application

### Normal Mode

```bash
npm start
```

### Debug Mode (recommended for troubleshooting)

```bash
npm run start:dev
```

### Advanced Debug Mode

```bash
npm run start:debug
```

## Common Troubleshooting

### 1. App Opens and Closes Immediately

**Cause**: Error during initialization
**Solution**:

1. Run in debug mode: `npm run start:dev`;
2. Check console for errors;
3. Verify user data folder was created.

### 2. Permission Errors

**Cause**: Antivirus or system permissions;
**Solution**:

1. Run terminal as Administrator (Windows) or use `sudo` (Linux/Mac);
2. Add antivirus exception for project folder;
3. Check permissions in user data folder.

### 3. Module Errors

**Cause**: Dependencies not installed correctly;
**Solution**:

```bash
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### 4. Notifications Not Working

**Windows**:

1. Go to `Settings` > `System` > `Notifications`;
2. Enable notifications for applications;
3. Restart CashMoo.

**macOS**:

1. Go to `System Preferences` > `Notifications`;
2. Find CashMoo and enable notifications;
3. Restart the application.

**Linux**:

1. Check if notification system is active;
2. Install `libnotify` if needed: `sudo apt-get install libnotify-bin`.

### 5. Icon and App Name Issues

**macOS**: If "Electron" appears instead of "CashMoo":

1. Ensure icon files are in `assets/` folder;
2. Clear icon cache: `sudo rm -rf /Library/Caches/com.apple.iconservices.store`;
3. Restart Dock: `killall Dock`;
4. Restart application.

**All Platforms**: If icons don't appear:

1. Verify icon files exist in `assets/` folder;
2. Check file permissions;
3. Clear Electron cache: `rm -rf node_modules/.cache`.

## File Structure

### Windows

```
%APPDATA%\cashmoo\
├── data\
│   ├── data.json
│   └── backups\
│       └── backup_*.json
```

### macOS

```
~/Library/Application Support/cashmoo/
├── data/
│   ├── data.json
│   └── backups/
│       └── backup_*.json
```

### Linux

```
~/.config/cashmoo/
├── data/
│   ├── data.json
│   └── backups/
│       └── backup_*.json
```

## Debug Logs

To view detailed logs:

1. Run: `npm run start:dev`;
2. Press `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (macOS);
3. Go to "Console" tab to see errors.

## Known Issues

### Windows Defender

- May block the application in some cases;
- **Solution**: Add exception for project folder.

### Older Windows Versions

- Windows 7 and 8 may have compatibility issues;
- **Solution**: Use Windows 10 or higher.

### Multiple Instances

- Only one instance should run at a time;
- **Solution**: Close other instances before starting.

### macOS Gatekeeper

- May block unsigned application;
- **Solution**: Use `Ctrl+Click` > "Open" on first run.

## Available Scripts

- `npm start` - Normal execution;
- `npm run start:dev` - Execution with detailed logs;
- `npm run start:debug` - Execution with advanced debug;
- `npm run start:windows` - Windows-optimized execution;
- `npm run lint` - Code verification and fixing;
- `npm run clean` - Clean dependencies;
- `npm run build` - Build for all platforms;
- `npm run build:win` - Build for Windows only;
- `npm run build:mac` - Build for macOS only;
- `npm run build:linux` - Build for Linux only.

## Updates

To update CashMoo:

```bash
git pull origin main
npm install
npm start
```

## Uninstallation

To completely remove:

1. Close the application;
2. Delete project folder;
3. Delete user data folder (see "File Structure");
4. Run `npm uninstall -g electron` (if globally installed).

## Platform-Specific Features

### Windows

- Native notification integration;
- Standard keyboard shortcuts support;
- Enhanced file management.

### macOS

- Menu bar integration;
- Trackpad gesture support;
- Human Interface Guidelines compliance.

### Linux

- Support for different desktop environments;
- File manager integration;
- System theme compatibility.

## Debug Steps

If the app still doesn't work:

1. **Check Node.js version**: `node --version` (must be ≥16.0.0);
2. **Run in debug mode**: `npm run start:dev`;
3. **Check file permissions**: Ensure write access to user data folder;
4. **Disable antivirus temporarily** to test for blocking;
5. **Check system logs** for system-level errors;
6. **Try running as administrator** if permission issues persist.

## Environment Variables

Set these environment variables for troubleshooting:

```bash
# Enable detailed Electron logging
export ELECTRON_ENABLE_LOGGING=true

# Disable hardware acceleration (graphics issues)
export ELECTRON_DISABLE_HARDWARE_ACCELERATION=true

# Debug mode for development
export NODE_ENV=development
```

## Performance Tips

- Close other Electron apps to free memory;
- Ensure adequate disk space in user data folder;
- Keep system updated for best compatibility;
- Use SSD for better performance.

## Support

If problems persist:

1. Run `npm run start:dev`;
2. Capture screenshot of console errors;
3. Note OS and Node.js versions;
4. Report the issue with this information.

## Contributing

To contribute to the project:

1. Fork the repository;
2. Create feature branch: `git checkout -b feature/new-feature`;
3. Commit changes: `git commit -m 'Add new feature'`;
4. Push to branch: `git push origin feature/new-feature`;
5. Open Pull Request.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

## Development

### Project Structure

```
cashmoo/
├── app/
│   ├── helpers/          # Utilities and helper functions
│   └── renderer/         # User interface
├── assets/               # Icons and resources
├── main.js              # Electron main process
├── preload.js           # Preload script for security
└── package.json         # Configuration and dependencies
```

### Technologies Used

- **Electron**: Desktop application framework;
- **JavaScript (ES6+)**: Main programming language;
- **HTML5/CSS3**: User interface;
- **Node.js**: JavaScript runtime.

### Code Standards

- Use camelCase for variables and functions;
- Keep functions small and focused;
- Document functions with JSDoc;
- Run `npm run lint` before commits.
