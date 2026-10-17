// Root sayfası testleri.
import { render, screen } from '@testing-library/react'
import RootView from '../../src/renderer/src/views/RootView'
import { useDeviceStore } from '../../src/renderer/src/store/useDeviceStore'
import type { Api } from '../../src/preload'
import type { Device, RootStatus } from '@shared/types'

// tsconfig.test.json, preload'un `Window.api` global bildirimini içermediği için
// test ortamında aynı bildirimi burada tekrarlarız (ts-jest programına girer).
declare global {
  interface Window {
    api: Api
  }
}

function cihaz(): Device {
  return {
    id: 'ABC123',
    name: 'Pixel 7',
    model: 'Pixel 7',
    platform: 'android',
    serialNumber: 'ABC123',
    status: 'online',
    connectionType: 'usb'
  }
}

const ROOTLU: RootStatus = { isRooted: true, suPath: '/system/xbin/su', magiskVersion: '28.0' }

describe('RootView', () => {
  beforeEach(() => {
    useDeviceStore.setState({ cihazlar: [], bilgiler: {}, seciliCihaz: null })
  })

  test('cihaz yoksa boş durum + rehber gösterir', () => {
    render(<RootView />)
    expect(screen.getByText('Telefon bağlı değil')).toBeTruthy()
    expect(screen.getByText('Root hakkında (önemli)')).toBeTruthy()
  })

  test('rootlu cihazın durumunu gösterir', async () => {
    const getRootStatus = jest.fn().mockResolvedValue(ROOTLU)
    window.api = { getRootStatus } as unknown as Api
    useDeviceStore.setState({ cihazlar: [cihaz()], bilgiler: {} })
    render(<RootView />)
    expect(await screen.findByText('Rootlu')).toBeTruthy()
    expect(screen.getByText(/Magisk: 28.0/)).toBeTruthy()
    expect(getRootStatus).toHaveBeenCalledWith('ABC123')
  })

  test("root olmayan cihazda Root'suz gösterir", async () => {
    const getRootStatus = jest.fn().mockResolvedValue({
      isRooted: false,
      suPath: null,
      magiskVersion: null
    })
    window.api = { getRootStatus } as unknown as Api
    useDeviceStore.setState({ cihazlar: [cihaz()], bilgiler: {} })
    render(<RootView />)
    expect(await screen.findByText("Root'suz")).toBeTruthy()
  })
})
