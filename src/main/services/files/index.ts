import { join, basename } from 'path'
import { adbExec } from '../adb'
import type { FileEntry, FileKind } from '@shared/types'

// 129 — Klasör listele: `adb shell ls -la <path>` çıktısını parse eder.
export async function listFiles(serial: string, path: string): Promise<FileEntry[]> {
  const out = await adbExec(['shell', 'ls', '-la', path], { serial })
  const parent = path.replace(/\/+$/, '')
  const entries: FileEntry[] = []

  for (const line of out.split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('total')) continue
    const tokens = t.split(/\s+/)
    if (tokens.length < 8) continue
    const isDir = tokens[0].startsWith('d')
    const size = Number(tokens[4])
    const name = tokens.slice(7).join(' ') || tokens[tokens.length - 1]
    if (!name || name === '.' || name === '..') continue
    entries.push({
      name,
      path: `${parent}/${name}`,
      sizeBytes: Number.isFinite(size) ? size : 0,
      isDir,
      permissions: tokens[0],
      modified: `${tokens[5]} ${tokens[6]}`
    })
  }
  return entries
}

// 130 — Dosya indir (pull); yerel yolu döndürür.
export async function pullFile(
  serial: string,
  remotePath: string,
  destDir: string
): Promise<string> {
  const name = basename(remotePath)
  const dest = join(destDir, name)
  await adbExec(['pull', remotePath, dest], { serial })
  return dest
}

// 131 — Dosya yükle (push).
export async function pushFile(
  serial: string,
  localPath: string,
  remoteDir: string
): Promise<void> {
  await adbExec(['push', localPath, remoteDir], { serial })
}

// 132 — Dosya/klasör sil.
export async function deleteFile(serial: string, remotePath: string): Promise<void> {
  await adbExec(['shell', 'rm', '-rf', remotePath], { serial })
}

// 133 — Klasör oluştur.
export async function createFolder(
  serial: string,
  parent: string,
  name: string
): Promise<void> {
  const full = `${parent.replace(/\/+$/, '')}/${name}`
  await adbExec(['shell', 'mkdir', '-p', full], { serial })
}

// 136 — Dosya türüne göre kategori.
export function fileKind(name: string, isDir: boolean): FileKind {
  if (isDir) return 'folder'
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'heic'].includes(ext)) return 'image'
  if (['mp4', 'mkv', 'avi', 'mov', 'webm', '3gp', 'flv'].includes(ext)) return 'video'
  if (['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'opus'].includes(ext)) return 'audio'
  if (['pdf', 'doc', 'docx', 'txt', 'md', 'xls', 'xlsx', 'ppt', 'pptx', 'csv', 'json', 'html', 'xml'].includes(ext))
    return 'document'
  if (['zip', 'rar', '7z', 'tar', 'gz', 'apk', 'ab'].includes(ext)) return 'archive'
  return 'other'
}
