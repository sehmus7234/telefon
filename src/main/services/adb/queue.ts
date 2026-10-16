// Komutları sıraya sokan basit kuyruk (prompt 35).
// Aynı anda tek adb komutu çalışır; bir hata zinciri koparmaz.
export class CommandQueue {
  private tail: Promise<void> = Promise.resolve()

  run<T>(fn: () => Promise<T>): Promise<T> {
    const result = this.tail.then(fn, fn)
    this.tail = result.then(
      () => undefined,
      () => undefined
    )
    return result
  }
}

// Tüm adb komutları bu kuyruktan geçer.
export const adbQueue = new CommandQueue()
