import { app } from 'electron';
import { restoreOrCreateWindow } from '/@/mainWindow';
import { platform } from 'node:process';
import updater from 'electron-updater';
import log from 'electron-log/main';

import './security-restrictions';
import { initIpc } from './modules/ipc';
import { deployServer, previewServer } from './modules/cli';
import { inspectorServer } from './modules/inspector';
// import { run } from './modules/bin';

log.initialize();

/**
 * Prevent electron from running multiple instances.
 */
const isSingleInstance = app.requestSingleInstanceLock();
if (!isSingleInstance) {
  app.quit();
  process.exit(0);
}
app.on('second-instance', restoreOrCreateWindow);

/**
 * Shout down background process if all windows was closed
 */
app.on('window-all-closed', async () => {
  await killAll();
  if (platform !== 'darwin') {
    app.quit();
  }
});

/**
 * @see https://www.electronjs.org/docs/latest/api/app#event-activate-macos Event: 'activate'.
 */
app.on('activate', restoreOrCreateWindow);

/**
 * Create the application window when app is ready.
 */

app
  .whenReady()
  .then(async () => {
    // const child = utilityProcess.fork('/Users/mostro/code/editor-electron/test.js', [], {
    //   stdio: 'pipe',
    //   env: {
    //     ...process.env,
    //     PATH: process.env.PATH + ':/Users/mostro/.nvm/versions/node/v20.12.2/bin',
    //   },
    // });
    // child.on('spawn', () => {
    //   log.info('test.js spawned');
    //   if (child.stdout) {
    //     child.stdout.on('data', data => {
    //       log.info(data.toString());
    //     });
    //   }
    //   if (child.stderr) {
    //     child.stderr!.on('data', data => {
    //       log.error(data.toString());
    //     });
    //   }
    // });
    initIpc();
    // run('sign-bunny', 'sign-bunny', 'HELLO');
    await restoreOrCreateWindow();
  })
  .catch(e => console.error('Failed create window:', e));

/**
 * Check for app updates, install it in background and notify user that new version was installed.
 * No reason run this in non-production build.
 * @see https://www.electron.build/auto-update.html#quick-setup-guide
 *
 * Note: It may throw "ENOENT: no such file app-update.yml"
 * if you compile production app without publishing it to distribution server.
 * Like `npm run compile` does. It's ok 😅
 */
if (import.meta.env.PROD) {
  app
    .whenReady()
    .then(() => updater.autoUpdater.checkForUpdatesAndNotify())
    .catch(e => console.error('Failed check and install updates:', e));
}

export async function killAll() {
  const promises = [];
  if (previewServer) {
    promises.push(previewServer.kill());
  }
  if (deployServer) {
    promises.push(deployServer.kill());
  }
  if (inspectorServer) {
    promises.push(inspectorServer.kill());
  }
  await Promise.all(promises);
}

app.on('before-quit', async event => {
  event.preventDefault();
  await killAll();
  app.exit();
});

app.setAppLogsPath('/Users/mostro/Desktop');
