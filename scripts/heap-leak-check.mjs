#!/usr/bin/env node
// Heap sızıntı denetimi (prompt 159) — gerçek V8 heap snapshot farkı.
// `--inspect` ile çalışan uygulamaya bağlanır, birden fazla heap anlık görüntüsü
// alır ve ardışık aralıklarda SÜREKLİ büyüyen sınıfları sızıntı adayı olarak raporlar.
//
// Kullanım:
//   1) Uygulamayı inspect ile başlat:  npm run dev:inspect   (veya --inspect=9229)
//   2) Başka terminalde:               npm run heap:check
//   Seçenekler:
//     --port 9229        inspector portu
//     --samples 4        alınacak örnek sayısı (varsayılan 2)
//     --delay 4000       örnekler arası bekleme (ms)
//     --min-intervals 2  bir sınıfın işaretlenmesi için büyümesi gereken
//                        en az aralık sayısı (varsayılan: min(2, samples-1))
//     --top 15           listelenecek en büyük aday sayısı

const args = process.argv.slice(2)
function opt(name, def) {
  const i = args.indexOf(name)
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : def
}
const port = parseInt(opt('--port', '9229'), 10)
const delayMs = parseInt(opt('--delay', '4000'), 10)
const samples = Math.max(2, parseInt(opt('--samples', '2'), 10))
const minIntervals = Math.max(
  1,
  parseInt(opt('--min-intervals', String(Math.min(2, samples - 1))), 10)
)
const top = parseInt(opt('--top', '15'), 10)

// Gürültü eşikleri: bir aralıkta "büyüme" sayılması için minimum değişim.
const MIN_DCOUNT = 5
const MIN_DSIZE = 1024 // 1 KB

// 1) Inspector hedefini bul.
let targets
try {
  const res = await fetch(`http://127.0.0.1:${port}/json/list`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  targets = await res.json()
} catch {
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
console.log(`Örnek sayısı: ${samples} · aralık beklemesi: ${delayMs} ms · min aralık: ${minIntervals}`)

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
  ws.onerror = () => reject(new Error('WebSocket hatası'))
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

// 4) N örnek al (aralarda GC + bekleme).
const snapshots = []
try {
  await send('HeapProfiler.enable')
  await send('HeapProfiler.collectGarbage')
  snapshots.push(aggregate(await takeSnapshot()))
  console.log(`Örnek 1/${samples} alındı.`)

  for (let i = 1; i < samples; i++) {
    console.log(`Bekleniyor: ${delayMs} ms ...`)
    await new Promise((r) => setTimeout(r, delayMs))
    await send('HeapProfiler.collectGarbage')
    snapshots.push(aggregate(await takeSnapshot()))
    console.log(`Örnek ${i + 1}/${samples} alındı.`)
  }

  // 5) Sınıf başına aralık deltalarını hesapla.
  const classNames = new Set()
  for (const s of snapshots) for (const n of s.keys()) classNames.add(n)

  const rows = []
  for (const name of classNames) {
    const counts = snapshots.map((s) => s.get(name)?.count ?? 0)
    const sizes = snapshots.map((s) => s.get(name)?.selfSize ?? 0)
    const deltas = []
    let growing = 0
    for (let i = 1; i < counts.length; i++) {
      const d = counts[i] - counts[i - 1]
      const ds = sizes[i] - sizes[i - 1]
      deltas.push(d)
      if (d >= MIN_DCOUNT || ds >= MIN_DSIZE) growing++
    }
    const total = counts[counts.length - 1] - counts[0]
    // Sızıntı adayı: en az `minIntervals` aralıkta sürekli büyüme.
    if (growing >= minIntervals && total >= MIN_DCOUNT) {
      rows.push({
        name,
        growing,
        intervals: counts.length - 1,
        total,
        totalSize: sizes[sizes.length - 1] - sizes[0],
        deltas,
        finalCount: counts[counts.length - 1]
      })
    }
  }

  rows.sort((x, y) => y.total - x.total)

  console.log('\nSızıntı adayları (ardışık aralıklarda sürekli büyüyen sınıflar):')
  if (rows.length === 0) {
    console.log('✓ Kalıcı büyüme tespit edilmedi.')
  } else {
    const table = rows.slice(0, top).map((r) => ({
      'Sınıf': r.name.length > 50 ? r.name.slice(0, 47) + '…' : r.name,
      'Δtoplam': r.total,
      'aralık': `${r.growing}/${r.intervals}`,
      'Δboyut': fmtBytes(r.totalSize),
      'detay': r.deltas.map((d) => (d >= 0 ? `+${d}` : `${d}`)).join(' '),
      'şimdi': r.finalCount
    }))
    console.table(table)
    console.log(
      `\n⚠️ ${rows.length} sınıf ${minIntervals}+ aralıkta sürekli büyüdü — gerçek sızıntı adayı.` +
        ` Tek aralıkta büyüme normal olabilir; "aralık" sütununda ${samples - 1}/${samples - 1}` +
        ' görmek güçlü bir sızıntı işaretidir.'
    )
  }
} finally {
  ws.close()
}
