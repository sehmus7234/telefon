import CommandConsole from '../components/CommandConsole'

export default function TestsView() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        ADB komutlarını çalıştırarak cihazı test edin. Çıktı ve stderr aşağıda gösterilir.
      </p>
      <CommandConsole />
    </div>
  )
}
