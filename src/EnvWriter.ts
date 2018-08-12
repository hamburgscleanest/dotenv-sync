import {EnvFile, ENV_FILE} from './Env.types';

class EnvWriter {
  private static _quoteIfNeeded(value: string) {
    if (value.indexOf(' ') === -1 || (value[0] === '"' && value.slice(-1) === '"')) {
      return value;
    }

    return `"${value}"`;
  }

  private static _createValue(pair: [string, string]) {
    pair[ENV_FILE.VALUE] = this._quoteIfNeeded(pair[ENV_FILE.VALUE]);

    return `${pair.join('=')}\n`;
  }

  public static async write(envFile: EnvFile, changedValues: Record<string, string>) {
    const fs = require('fs');

    const file = fs.createWriteStream(envFile.path);
    file.on('error', function(error: any) {
      console.error(error);
    });

    for (const pair of Object.entries(envFile.values)) {
      const key = pair[ENV_FILE.KEY];
      if (changedValues[key]) {
        pair[ENV_FILE.VALUE] = changedValues[key];
        delete changedValues[key];
      }

      file.write(EnvWriter._createValue(pair));
    }

    for (const pair of Object.entries(changedValues)) {
      file.write(EnvWriter._createValue(pair));
    }

    file.end();

    return new Promise(resolve =>
      file.on('finish', () => {
        resolve(envFile.path);
      })
    );
  }
}

export default EnvWriter;
