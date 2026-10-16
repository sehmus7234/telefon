import { adbExec } from './exec'

// ADB server kontrolü (prompt 19)
export function startServer(): Promise<string> {
  return adbExec(['start-server'])
}

export function killServer(): Promise<string> {
  return adbExec(['kill-server'])
}

// Server'ı yeniden başlatır: kill-server + start-server (prompt 29).
export async function restartServer(): Promise<string> {
  await killServer()
  return startServer()
}
