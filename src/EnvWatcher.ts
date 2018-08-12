import {workspace, FileSystemWatcher, Uri, window, WorkspaceConfiguration} from 'vscode';
import EnvReader from './EnvReader';
import EnvWriter from './EnvWriter';
import {EnvFile} from './Env.types';
import EnvCurrent from './EnvCurrent';
import EnvDiff from './EnvDiff';

class EnvWatcher {
  private _watcher: FileSystemWatcher | undefined;
  private _trackedFiles: Record<string, EnvFile> = {};

  public async start() {
    if (this._watcher) {
      window.showErrorMessage('DotEnv-Sync is already running!');

      return;
    }

    const filePattern = workspace.getConfiguration('dotenv-sync').get<string>('watchFilePattern') || '**/.env.*';

    this._trackedFiles = await EnvReader.getAllFiles(filePattern);

    this._watcher = workspace.createFileSystemWatcher(filePattern);
    this._watcher.onDidCreate(this.onCreate);
    this._watcher.onDidChange(this.onChange);
    this._watcher.onDidDelete(this.onDelete);
  }

  public stop() {
    if (!this._watcher) {
      window.showErrorMessage('DotEnv-Sync is not running!');

      return;
    }

    this._watcher.dispose();
    this._watcher = undefined;
    this._trackedFiles = {};
  }

  private onCreate = async (uri: Uri) => {
    const createdFile = await EnvReader.getFile(uri);
    if (!createdFile) {
      return;
    }

    this._trackedFiles[createdFile.fileName] = createdFile;

    window.showInformationMessage(`'${createdFile.fileName}' created`);
  };

  private onChange = async (uri: Uri) => {
    const changedFile = await EnvReader.getFile(uri);
    if (!changedFile) {
      return;
    }

    const trackedFile = this._trackedFiles[changedFile.fileName];
    const values = trackedFile
      ? await EnvDiff.getChanges(trackedFile)
      : await EnvDiff.getChanges(await EnvCurrent.getFile());

    const changedKeys = Object.keys(values);
    if (changedKeys.length === 0) {
      return;
    }

    window.showInformationMessage(`'${changedFile.fileName}' changed`);

    const currentEnv = await EnvCurrent.getFile();
    const changedValues: Record<string, string> = {};
    for (const key of changedKeys) {
      const envValue = values[key];
      if (currentEnv.values[key] === envValue.changed) {
        continue;
      }

      const input = await window.showInputBox({
        prompt: `'${key}' changed from '${envValue.current || ''}' to '${envValue.changed || ''}'`,
        value: envValue.changed || ''
      });

      /**
       * TODO:
       * If the user cancels the input we might have to write an empty value into the file.
       * Otherwise the value will always count as 'removed' from the tracked file.
       * So we just write 'SOME_VALUE=' into the file to mark it as empty.
       */
      if (input) {
        changedValues[key] = input;
      }
    }

    if (Object.keys(changedValues).length === 0) {
      return;
    }

    await EnvWriter.write(currentEnv, changedValues);
    this._trackedFiles[changedFile.fileName] = await EnvReader.getFile(uri);
  };

  private onDelete = async (uri: Uri) => {
    const trackedFile = this._trackedFiles[uri.path];

    // TODO: Show values that were 'deleted'..
    console.info(trackedFile);

    window.showWarningMessage(`'${uri.path}' deleted`);

    delete this._trackedFiles[uri.path];
  };
}

export default EnvWatcher;
