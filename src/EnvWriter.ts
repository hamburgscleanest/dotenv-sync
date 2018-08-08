import { EnvFile } from './Env.types';

class EnvWriter {
  public static write(envFile: EnvFile, changedValues: Record<string, string>) {
    const envWriter = new EnvWriter();

    return envWriter.write(envFile, changedValues);
  }

  private _createValue(pair: [string, string]) {
    return `${pair.join('=')}\n`;
  }

  public write(envFile: EnvFile, changedValues: Record<string, string>) {
    const fs = require('fs');

    const file = fs.createWriteStream(envFile.path);
    file.on('error', function(error: any) {
      console.error(error);
    });

    for (const pair of Object.entries(envFile.values)) {
      const key = pair[0];
      if (changedValues[key]) {
        pair[1] = changedValues[key];
        delete changedValues[key];
      }

      file.write(this._createValue(pair));
    }

    for (const pair of Object.entries(changedValues)) {
      file.write(this._createValue(pair));
    }

    file.end();

    return this;
  }
}

export default EnvWriter;
