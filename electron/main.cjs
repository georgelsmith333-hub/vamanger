const { app, BrowserWindow, Menu, shell, nativeImage } = require('electron');
const path = require('path');

const APP_URL = process.env.VA_MANAGER_URL || 'https://va-manager.onrender.com';
const isDev = !app.isPackaged;

let mainWindow = null;

function createWindow() {
  const iconPath = path.join(__dirname, 'icon.png');
  let icon;
  try {
    icon = nativeImage.createFromPath(iconPath);
  } catch {
    icon = undefined;
  }

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#0F172A',
    title: 'VA Manager',
    icon,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.loadURL(APP_URL);

  // Open external links (e.g. Google OAuth, mailto:) in the default browser.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(APP_URL)) {
      return { action: 'allow' };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(APP_URL)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

const menuTemplate = [
  ...(process.platform === 'darwin' ? [{ role: 'appMenu' }] : []),
  {
    label: 'File',
    submenu: [
      { label: 'Reload', accelerator: 'CmdOrCtrl+R', click: () => mainWindow?.reload() },
      { type: 'separator' },
      process.platform === 'darwin' ? { role: 'close' } : { role: 'quit' },
    ],
  },
  { role: 'editMenu' },
  {
    label: 'View',
    submenu: [
      { role: 'togglefullscreen' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { role: 'resetZoom' },
    ],
  },
  {
    label: 'Help',
    submenu: [
      {
        label: 'Open Web Version',
        click: () => shell.openExternal(APP_URL),
      },
      {
        label: 'About VA Manager',
        click: () => {
          const { dialog } = require('electron');
          dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'About VA Manager',
            message: 'VA eBay Client Manager',
            detail: `Version ${app.getVersion()}\nA premium dashboard for eBay dropshipping virtual assistants.`,
          });
        },
      },
    ],
  },
];

app.whenReady().then(() => {
  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
