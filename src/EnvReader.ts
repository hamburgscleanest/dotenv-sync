import { Uri, workspace } from 'vscode';
import { EnvFile, isEnvFile, ChangedValues } from './Env.types';

class EnvReader {
  private _envFile: EnvFile | undefined;

  private static _getValues(content: string): Record<string, string> {
    const pairs = content.split(/\r\n|\r|\n/g);

    return pairs
      .filter(Boolean)
      .reduce(function(value: Record<string, string>, pair: string) {
        const keyValue = pair.split('=');
        if (keyValue.length !== 2) {
          throw new Error(`Unexpected key/value pair: ${pair}`);
        }

        value[keyValue[0]] = keyValue[1];

        return value;
      }, {});
  }

  private static async _getEnvFile(uri: Uri): Promise<EnvFile> {
    const document = await workspace.openTextDocument(uri);

    return {
      fileName: document.fileName
        .split('\\')
        .pop()!
        .split('/')
        .pop()!,
      path: document.fileName,
      values: EnvReader._getValues(document.getText())
    };
  }

  public static async getFiles(filePattern: string) {
    const locations = await workspace.findFiles(filePattern);
    const fileCount = locations.length;

    const files: Record<string, EnvFile> = {};
    for (let i = 0; i < fileCount; i++) {
      const envFile = await this._getEnvFile(Uri.file(locations[i].path));
      files[envFile.fileName] = envFile;
    }

    return files;
  }

  public static async read(uri: Uri) {
    const envReader = new EnvReader();

    return await envReader.read(uri);
  }

  public async read(uri: Uri) {
    this._envFile = await EnvReader._getEnvFile(uri);

    return this;
  }

  private _currentEnvFile: EnvFile | undefined;
  public async getCurrentEnvFile(): Promise<EnvFile> {
    if (this._currentEnvFile) {
      return this._currentEnvFile;
    }

    const location = await workspace.findFiles('**/.env');
    if (location.length === 0) {
      return {
        fileName: '.env',
        path: './.env',
        values: {}
      };
    }

    this._currentEnvFile = await EnvReader._getEnvFile(
      Uri.file(location[0].path)
    );

    return this._currentEnvFile;
  }

  public getFile() {
    return this._envFile;
  }

  // TODO: Refactor..
  private _getChangedValues(currentEnvFile: EnvFile): ChangedValues {
    if (!this._envFile) {
      throw new Error("Didn't read any .env file!");
    }

    const checkedKeys: string[] = [];
    const values: ChangedValues = {};

    for (const entry of Object.entries(currentEnvFile.values)) {
      const key = entry[0];
      checkedKeys.push(key);

      const currentValue = entry[1];
      const value = this._envFile.values[key];
      if (value === currentValue) {
        continue;
      }

      values[key] = {
        current: currentValue,
        changed: value
      };
    }

    for (const entry of Object.entries(this._envFile.values)) {
      const key = entry[0];
      if (checkedKeys.includes(key)) {
        continue;
      }

      values[key] = {
        current: undefined,
        changed: entry[1]
      };
    }

    return values;
  }

  public async compare(envFileOrUri: EnvFile | Uri): Promise<ChangedValues> {
    if (isEnvFile(envFileOrUri)) {
      return await this._getChangedValues(envFileOrUri as EnvFile);
    }

    return this._getChangedValues(
      await EnvReader._getEnvFile(envFileOrUri as Uri)
    );
  }

  public async compareWithCurrent() {
    const currentEnvFile = await this.getCurrentEnvFile();

    return await this.compare(currentEnvFile);
  }
}

export default EnvReader;
