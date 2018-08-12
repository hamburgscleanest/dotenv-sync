import {EnvFile} from './Env.types';
import {workspace, Uri} from 'vscode';
import EnvReader from './EnvReader';

class EnvCurrent {
  private static readonly emptyFile = {
    fileName: '.env',
    path: './.env',
    values: {}
  };

  public static getFilePath() {
    return workspace.getConfiguration('dotenv-sync').get<string>('envFilePath');
  }

  public static async getFile(): Promise<EnvFile> {
    const filePath = EnvCurrent.getFilePath();
    if (!filePath) {
      throw new Error('File path to environment file is invalid!');
    }

    const location = await workspace.findFiles(filePath);
    if (location.length === 0) {
      return this.emptyFile;
    }

    return await EnvReader.getFile(Uri.file(location[0].path));
  }
}

export default EnvCurrent;
