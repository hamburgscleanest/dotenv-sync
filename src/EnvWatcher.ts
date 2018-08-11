import {
  workspace,
  FileSystemWatcher,
  Uri,
  window,
  WorkspaceConfiguration
} from 'vscode';
import EnvReader from './EnvReader';
import EnvWriter from './EnvWriter';
import { EnvFile } from './Env.types';

class EnvWatcher {
  private _config: WorkspaceConfiguration;
  private _watcher: FileSystemWatcher | undefined;
  private _trackedFiles: Record<string, EnvFile> = {};

  public constructor() {
    this._config = workspace.getConfiguration('dotenv-sync');
  }

  private _getFilePattern() {
    return this._config.get<string>('filePattern') || '**/.env.*';
  }

  public start = () => {
    if (this._watcher) {
      window.showErrorMessage('DotEnv-Sync is already running!');

      return;
    }

    const filePattern = this._getFilePattern();

    EnvReader.getFiles(filePattern).then(files => (this._trackedFiles = files));

    // TODO: Implement blacklist..

    this._watcher = workspace.createFileSystemWatcher(filePattern);
    this._watcher.onDidCreate(this.onCreate);
    this._watcher.onDidChange(this.onChange);
    this._watcher.onDidDelete(this.onDelete);
  };

  public stop = () => {
    if (!this._watcher) {
      window.showErrorMessage('DotEnv-Sync is not running!');

      return;
    }

    this._watcher.dispose();
    this._watcher = undefined;
  };

  private onCreate = async (uri: Uri) => {
    const reader = await EnvReader.read(uri);
    const createdFile = reader.getFile();
    if (!createdFile) {
      return;
    }

    window.showInformationMessage(`'${createdFile.fileName}' created`);
  };

  // TODO: Refactor
  private onChange = async (uri: Uri) => {
    const reader = await EnvReader.read(uri);
    const changedFile = reader.getFile();
    if (!changedFile) {
      return;
    }

    const currentEnv = await reader.getCurrentEnvFile();
    const trackedFile = this._trackedFiles[changedFile.fileName];
    let values;
    if (trackedFile) {
      values = await reader.compare(trackedFile);
    } else {
      values = await reader.compareWithCurrent();
    }

    this._trackedFiles[changedFile.fileName] = changedFile;

    const changedKeys = Object.keys(values);
    if (changedKeys.length === 0) {
      return;
    }

    window.showInformationMessage(`'${changedFile.fileName}' changed`);

    const changedValues: Record<string, string> = {};
    for (const key of changedKeys) {
      const envValue = values[key];
      if (currentEnv.values[key] === envValue.changed) {
        continue;
      }

      const input = await window.showInputBox({
        prompt: `'${key}' changed from '${envValue.current ||
          ''}' to '${envValue.changed || ''}'`,
        value: envValue.changed || ''
      });

      if (input) {
        changedValues[key] = input;
      }
    }

    if (Object.keys(changedValues).length === 0) {
      return;
    }

    EnvWriter.write(currentEnv, changedValues);
  };

  private onDelete = async (uri: Uri) => {
    window.showWarningMessage(`'${uri.fsPath}' deleted`);
  };
}

export default EnvWatcher;
