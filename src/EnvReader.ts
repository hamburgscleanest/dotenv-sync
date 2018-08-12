import {Uri, workspace} from 'vscode';
import {EnvFile, ENV_FILE} from './Env.types';

class EnvReader {
  private static _getValues(content: string): Record<string, string> {
    const pairs = content.split(/\r\n|\r|\n/g);

    return pairs.filter(Boolean).reduce(function(value: Record<string, string>, pair: string) {
      const keyValue = pair.split('=');
      if (keyValue.length !== 2) {
        throw new Error(`Unexpected key/value pair: ${pair}`);
      }

      value[keyValue[ENV_FILE.KEY]] = keyValue[ENV_FILE.VALUE];

      return value;
    }, {});
  }

  public static async getFile(uri: Uri): Promise<EnvFile> {
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

  public static async getAllFiles(filePattern: string) {
    const locations = await workspace.findFiles(filePattern);
    const fileCount = locations.length;

    const files: Record<string, EnvFile> = {};
    for (let i = 0; i < fileCount; i++) {
      const envFile = await EnvReader.getFile(Uri.file(locations[i].path));
      files[envFile.fileName] = envFile;
    }

    return files;
  }
}

export default EnvReader;
