const { app, BrowserWindow, protocol } = require('electron');
const path = require('path');
const fs = require('fs');

// 1. Register 'app' as a standard protocol so Next.js routing works
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } }
]);

async function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // 2. The Logic: This handles the mapping of "/sign-in" to "sign-in/index.html"
  protocol.handle('app', async (request) => {
    const url = new URL(request.url);
    let relativePath = url.pathname; // This will be "/" or "/sign-in"

    // If it's the root, load index.html
    if (relativePath === '/' || relativePath === '') {
      relativePath = 'index.html';
    } 
    // If it's a route without an extension (like /sign-in), map to /sign-in/index.html
    else if (!path.extname(relativePath)) {
      relativePath = path.join(relativePath, 'index.html');
    }

    // Strip leading slash for path.join
    const finalPath = path.join(__dirname, 'out', relativePath.startsWith('/') ? relativePath.substring(1) : relativePath);

    try {
      return new Response(fs.readFileSync(finalPath));
    } catch (e) {
      console.error("Protocol Error: Could not find file at", finalPath);
      return new Response("Not Found", { status: 404 });
    }
  });

  // 3. Load using the custom protocol
  win.loadURL('app://-/');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

if (process.platform === 'linux') {
  app.commandLine.appendSwitch('no-sandbox');
  app.commandLine.appendSwitch('disable-gpu-sandbox');
}