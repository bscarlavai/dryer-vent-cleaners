/**
 * TypeScript declarations for Ezoic ad integration
 */

export {}

declare global {
  interface EzoicStandalone {
    cmd: Array<() => void>
    showAds: (...placeholderIds: number[]) => void
  }

  interface Window {
    ezstandalone: EzoicStandalone
  }
}
