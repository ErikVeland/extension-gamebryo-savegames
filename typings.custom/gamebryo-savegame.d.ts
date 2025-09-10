declare module 'gamebryo-savegame' {
  export interface Dimensions {
    width: number;
    height: number;
  }

  export interface ISaveGame {
    saveNumber: number;
    characterName: string;
    characterLevel: number;
    filename: string;
    location: string;
    plugins: string[];
    screenshot: Buffer;
    screenshotSize: Dimensions;
    creationTime: number;
    playTime: string;
  }

  export function create(filePath: string, quick: boolean, callback: (err: Error | null, savegame: ISaveGame) => void): void;
}