# CashMoo

## System Requirements

- **Node.js**: Version 16.0.0 or higher;
- **Windows**: Windows 10 or higher.

## Installation

### 1. Check Node.js

Open Command Prompt or PowerShell and run:

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

## Running the Application

### Normal Mode

```bash
npm start
```

### Debug Mode (recommended for troubleshooting)

```bash
npm run start:dev
```

### Windows-Specific Mode

```bash
npm run start:windows
```

## Common Troubleshooting

### 1. App Opens and Closes Immediately

**Cause**: Error during initialization;
**Solution**:

1. Run in debug mode: `npm run start:dev`;
2. Check console for errors;
3. Verify if `%APPDATA%\CashMoo` folder was created.

### 2. Permission Errors

**Cause**: Antivirus or system permissions;
**Solution**:

1. Run Command Prompt as Administrator;
2. Add antivirus exception for project folder;
3. Check permissions in `%APPDATA%` folder.

### 3. Module Errors

**Cause**: Dependencies not installed correctly;
**Solution**:

```bash
# Clear cache and reinstall
npm cache clean --force
rmdir /s node_modules
del package-lock.json
npm install
```

### 4. File Path Issues

**Cause**: Path separator incompatibility;
**Solution**: This issue has been fixed in the current version.

### 5. Notifications Not Working

**Cause**: Notifications disabled in Windows;
**Solution**:

1. Go to `Settings` > `System` > `Notifications`;
2. Enable notifications for applications;
3. Restart CashMoo;

## File Structure on Windows

CashMoo creates the following directories on Windows:

```
%APPDATA%\CashMoo\
├── data\
│   ├── data.json          # Main data
│   └── backups\           # Automatic backups
│       └── backup_*.json
```

## Debug Logs

To view detailed logs:

1. Run: `npm run start:dev`;
2. Press `Ctrl+Shift+I` to open DevTools;
3. Go to "Console" tab to see errors.

## Known Issues

### Windows Defender

- Some users report Windows Defender may block the app;
- **Solution**: Add exception for project folder.

### Older Windows Versions

- Windows 7 and 8 may have compatibility issues;
- **Solution**: Use Windows 10 or higher.

### Multiple Instances

- Only one instance of the app should run at a time;
- **Solution**: Close other instances before starting.

## Support Contact

If problems persist:

1. Run `npm run start:dev`;
2. Capture screenshot of console errors;
3. Note Windows and Node.js versions;
4. Report the issue with this information.

## Available Scripts

- `npm start` - Normal execution;
- `npm run start:dev` - Execution with detailed logs;
- `npm run start:windows` - Windows-optimized execution;
- `npm run lint` - Code verification.

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
3. Delete `%APPDATA%\CashMoo` (user data);
4. Run `npm uninstall -g electron` (if globally installed).

## Windows-Specific Features

### Enhanced Error Handling

- Improved file system operations;
- Better path normalization;
- Fallback directories for user data.

### Window Management

- Prevents window flashing on startup;
- Auto-hide menu bar;
- Proper window ready detection.

### Security

- Certificate error handling for local files;
- Secure sandbox configuration;
- Antivirus compatibility improvements.

## Debugging Steps

If the app still doesn't work:

1. **Check Node.js version**: `node --version` (must be ≥16.0.0);
2. **Run in debug mode**: `npm run start:dev`;
3. **Check file permissions**: Ensure write access to `%APPDATA%`;
4. **Disable antivirus temporarily** to test if it's blocking;
5. **Check Windows Event Viewer** for system-level errors;
6. **Try running as Administrator** if permission issues persist.

## Environment Variables

You can set these environment variables for troubleshooting:

```bash
# Enable detailed Electron logging
set ELECTRON_ENABLE_LOGGING=true

# Disable hardware acceleration (if graphics issues)
set ELECTRON_DISABLE_HARDWARE_ACCELERATION=true
```

## Performance Tips

- Close other Electron apps to free memory;
- Ensure adequate disk space in `%APPDATA%`;
- Keep Windows updated for best compatibility;
- Use SSD for better performance.
