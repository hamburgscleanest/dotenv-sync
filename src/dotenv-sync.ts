'use strict';

import { commands, ExtensionContext, window } from 'vscode';
import EnvWatcher from './EnvWatcher';

const watcher = new EnvWatcher();

const startCommand = () => {
  watcher.start();
  window.showInformationMessage('DotEnv-Sync is now watching for updates');
};

const stopCommand = () => {
  watcher.stop();
  window.showInformationMessage('Stopped DotEnv-Sync');
};

export function activate(context: ExtensionContext) {
  commands.executeCommand('dotenv-sync.start');

  context.subscriptions.push(
    commands.registerCommand('dotenv-sync.start', startCommand),
    commands.registerCommand('dotenv-sync.stop', stopCommand)
  );
}

export function deactivate() {
  commands.executeCommand('dotenv-sync.stop');
}
