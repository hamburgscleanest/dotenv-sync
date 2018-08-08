export interface EnvFile {
  fileName: string;
  path: string;
  values: Record<string, string>;
}

export interface EnvValue {
  current: string | undefined;
  changed: string | undefined;
}

export function isEnvFile(object: any): object is EnvValue {
  return object.query === undefined;
}

export type ChangedValues = Record<string, EnvValue>;
