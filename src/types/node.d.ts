declare const process: any;
declare const require: any;

declare module 'path' {
  export function join(...paths: string[]): string;
  export function resolve(...paths: string[]): string;
}

declare module 'fs' {
  export function existsSync(path: string): boolean;
  export function mkdirSync(path: string, options?: { recursive?: boolean }): string;
  export function appendFileSync(path: string, data: string, options?: { encoding?: string }): void;
}
