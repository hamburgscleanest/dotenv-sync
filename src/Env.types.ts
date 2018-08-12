export interface EnvFile {
  fileName: string;
  path: string;
  values: Record<string, string>;
}

export interface EnvValue {
  current: string | undefined;
  changed: string | undefined;
}

export type ChangedValues = Record<string, EnvValue>;

export enum ENV_FILE {
  KEY = 0,
  VALUE = 1
}
