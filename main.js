const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false, // Security best practice
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'), // If you need to talk to the OS
    },
  });

  // Logic: In development, you might load localhost. 
  // In production (static export), we load the 'out/index.html' file.
  const isDev = !app.isPackaged;

  if (isDev) {
    win.loadURL('http://localhost:3000');
  } else {
    // Logic: Use path.join to ensure cross-platform compatibility
    win.loadFile(path.join(__dirname, 'out/index.html'));
  }

  // Optional: Open DevTools automatically in dev mode
  if (isDev) win.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});