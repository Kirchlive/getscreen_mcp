declare module "screenshot-desktop" {
  export interface Display {
    id: number;
    name: string;
  }

  export interface ScreenshotOptions {
    screen?: number;
    format?: "png" | "jpg";
  }

  function screenshot(options?: ScreenshotOptions): Promise<Buffer>;

  namespace screenshot {
    function listDisplays(): Promise<Display[]>;
  }

  export default screenshot;
}
