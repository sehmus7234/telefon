#!/usr/bin/env node
// Heap sızıntı denetimi (prompt 159) — gerçek V8 heap snapshot farkı.
// `--inspect` ile çalışan uygulamaya bağlanır, iki heap anlık görüntüsü alır
// ve aradaki büyüyen nesne sınıflarını listeler (olası sızıntı adayları).
//
// Kullanım:
//   1) Uygulamayı inspect ile başlat:  npm run dev:inspect   (veya --inspect=9229)
//   2) Başka terminalde:               npm run heap:check
//   Seçenekler: --port 9229 --delay 5000 --top 15

const args = process.argv.slice(2)
function opt(name, def) {
  const i = args.indexOf(name)
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : def
}
const port = parseInt(opt('--port', '9229'), 10)
const delayMs = parseInt(opt('--delay', '4000'), 10)
const top = parseInt(opt('--top', '15'), 10)

// 1) Inspector hedefini bul.
let targets
try {
  const res = await fetch(`http://127.0.0.1:${port}/json/list`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  targets = await res.json()
} catch (e) {
  console.error(`Inspector bulunamadı (${port}). Uygulama --inspect ile mi başlatıldı?`)
  console.error(`  npm run dev:inspect   veya   npx electron --inspect=${port} .`)
  process.exit(1)
}

const target = targets.find((t) => t.type === 'node') ?? targets[0]
if (!target || !target.webSocketDebuggerUrl) {
  console.error('Bağlanılabilir hedef bulunamadı.')
  process.exit(1)
}
console.log(`Hedef: ${target.title || target.type} (${target.type})`)
console.log(`İki örnek arası bekleme: ${delayMs} ms`)

// 2) CDP bağlantısı.
const ws = new WebSocket(target.webSocketDebuggerUrl)
let nextId = 1
const pending = new Map()
let chunks = []

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = nextId++
    pending.set(id, { resolve, reject })
    ws.send(JSON.stringify({ id, method, params }))
  })
}

ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data)
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id)
    pending.delete(msg.id)
    msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result)
  } else if (msg.method === 'HeapProfiler.addHeapSnapshotChunk') {
    chunks.push(msg.params.chunk)
  }
}

await new Promise((resolve, reject) => {
  ws.onopen = resolve
  ws.onerror = (e) => reject(new Error('WebSocket hatası'))
})

async function takeSnapshot() {
  chunks = []
  // Node inspector, komut yanıtı dönmeden önce tüm chunk'ları gönderir; yanıt
  // dönünce snapshot tamamdır (boş chunk terminatörü gerekmez).
  await send('HeapProfiler.takeHeapSnapshot', { reportProgress: false })
  return JSON.parse(chunks.join(''))
}

// 3) Snapshot'ı sınıf adına göre topla (count + self_size).
function aggregate(snap) {
  const meta = snap.snapshot.meta
  const fields = meta.node_fields
  const nameIdx = fields.indexOf('name')
  const sizeIdx = fields.indexOf('self_size')
  const stride = fields.length
  const { nodes, strings } = snap
  const count = snap.snapshot.node_count
  const byClass = new Map()
  for (let i = 0; i < count; i++) {
    const base = i * stride
    const name = strings[nodes[base + nameIdx]]
    const selfSize = nodes[base + sizeIdx]
    const cur = byClass.get(name) ?? { count: 0, selfSize: 0 }
    cur.count++
    cur.selfSize += selfSize
    byClass.set(name, cur)
  }
  return byClass
}

function fmtBytes(n) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}

// 4) İki örneği al ve farkı hesapla.
try {
  await send('HeapProfiler.enable')
  await send('HeapProfiler.collectGarbage')
  const a = aggregate(await takeSnapshot())

  console.log(`Bekleniyor: ${delayMs} ms ...`)
  await new Promise((r) => setTimeout(r, delayMs))

  await send('HeapProfiler.collectGarbage')
  const b = aggregate(await takeSnapshot())

  const rows = []
  for (const [name, bv] of b) {
    const av = a.get(name)
    if (!av) continue
    const dCount = bv.count - av.count
    const dSize = bv.selfSize - av.selfSize
    if (dCount > 0 || dSize > 0) {
      rows.push({ name, dCount, dSize, count: bv.count, selfSize: bv.selfSize })
    }
  }
  // Gürültüyü ele: anlamlı eşiklerin altındakileri at.
  const candidates = rows.filter((r) => r.dCount >= 5 || r.dSize >= 1024)
  candidates.sort((x, y) => y.dCount - x.dCount)

  console.log('\nBüyüyen sınıflar (olası sızıntı adayları):')
  if (candidates.length === 0) {
    console.log('✓ Anlamlı büyüme tespit edilmedi.')
  } else {
    const table = candidates.slice(0, top).map((r) => ({
      'Sınıf': r.name.length > 60 ? r.name.slice(0, 57) + '…' : r.name,
      'Δadet': r.dCount,
      'Δboyut': fmtBytes(r.dSize),
      'şimdi': r.count
    }))
    console.table(table)
    console.log(
      `\n⚠️ ${candidates.length} sınıf büyüdü. Tek seferlik artış normal olabilir;` +
        ' sızıntı doğrulaması için uygulamayı kullanırken birden fazla kez çalıştırıp' +
        ' aynı sınıfların sürekli arttığını gözlemleyin.'
    )
  }
} finally {
  ws.close()
}
