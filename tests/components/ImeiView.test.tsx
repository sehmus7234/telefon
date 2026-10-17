// Telefon IMEI sayfası testleri.
import { render, screen } from '@testing-library/react'
import ImeiView from '../../src/renderer/src/views/ImeiView'
import { useDeviceStore } from '../../src/renderer/src/store/useDeviceStore'
import type { Api } from '../../src/preload'
import type { Device, DeviceInfo } from '@shared/types'

// tsconfig.test.json, preload'un `Window.api` global bildirimini içermediği için
// test ortamında aynı bildirimi burada tekrarlarız (ts-jest programına girer).
declare global {
  interface Window {
    api: Api
  }
}

function cihaz(overrides: Partial<Device> = {}): Device {
  return {
    id: 'ABC123',
    name: 'Pixel 7',
    model: 'Pixel 7',
    platform: 'android',
    serialNumber: 'ABC123',
    status: 'online',
    connectionType: 'usb',
    ...overrides
  }
}

function bilgi(imei: string | null): DeviceInfo {
  return {
    device: cihaz(),
    model: 'Pixel 7',
    manufacturer: 'Google',
    osVersion: '14',
    apiLevel: 34,
    serialNo: 'ABC123',
    imei,
    battery: null,
    screen: null,
    cpu: null,
    memory: null,
    storage: null,
    isRooted: false,
    macAddress: null,
    locale: null,
    packages: null
  }
}

describe('ImeiView', () => {
  beforeEach(() => {
    useDeviceStore.setState({ cihazlar: [], bilgiler: {}, seciliCihaz: null })
  })

  test('cihaz bağlı değilse boş durum gösterir', () => {
    render(<ImeiView />)
    expect(screen.getByText('Telefon bağlı değil')).toBeTruthy()
  })

  test("bağlı cihazın IMEI'sini gösterir", () => {
    useDeviceStore.setState({
      cihazlar: [cihaz()],
      bilgiler: { ABC123: bilgi('860123456789012') }
    })
    render(<ImeiView />)
    expect(screen.getByText('860123456789012')).toBeTruthy()
  })

  test('IMEI yoksa bilgilendirme gösterir', () => {
    useDeviceStore.setState({
      cihazlar: [cihaz()],
      bilgiler: { ABC123: bilgi(null) }
    })
    render(<ImeiView />)
    expect(screen.getByText('IMEI alınamadı')).toBeTruthy()
  })

  test('bilgi yoksa otomatik çeker', async () => {
    const getDeviceInfo = jest.fn().mockResolvedValue(bilgi('860123456789012'))
    window.api = { getDeviceInfo } as unknown as Api
    useDeviceStore.setState({ cihazlar: [cihaz()], bilgiler: {} })
    render(<ImeiView />)
    expect(await screen.findByText('860123456789012')).toBeTruthy()
    expect(getDeviceInfo).toHaveBeenCalledWith('ABC123')
  })
})
