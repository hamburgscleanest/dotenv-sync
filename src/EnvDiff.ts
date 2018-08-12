import {ChangedValues, EnvFile, ENV_FILE} from './Env.types';
import EnvCurrent from './EnvCurrent';

class EnvDiff {
  /**
   * Even if it's invalid and should never happen,
   * we want to make sure to not get false-positives for cases like this:
   *
   * Value in '.env' -> SOME_KEY="SOME VALUE" / Value in '.env.other' -> SOME_KEY=SOME VALUE
   *
   * @param value dotenv file value
   */
  private static _removeQuotes(value: string | undefined) {
    return value && value.replace(/^"(.+(?="$))"$/, '$1');
  }

  public static async getChanges(envFile: EnvFile) {
    const currentFile = await EnvCurrent.getFile();
    const checkedKeys: string[] = [];
    const values: ChangedValues = {};

    for (const entry of Object.entries(currentFile.values)) {
      const key = entry[ENV_FILE.KEY];
      checkedKeys.push(key);

      const currentValue = EnvDiff._removeQuotes(entry[ENV_FILE.VALUE]);
      const value = EnvDiff._removeQuotes(envFile.values[key]);
      if (value === currentValue) {
        continue;
      }

      values[key] = {
        current: currentValue,
        changed: value
      };
    }

    for (const entry of Object.entries(envFile.values).filter(pair => !checkedKeys.includes(pair[ENV_FILE.KEY]))) {
      values[entry[ENV_FILE.KEY]] = {
        current: undefined,
        changed: entry[ENV_FILE.VALUE]
      };
    }

    return values;
  }
}
export default EnvDiff;
