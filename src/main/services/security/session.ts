// Kullanıcı oturum yönetimi (prompt 146, opsiyonel).
// Uygulamayı bir ana parola ile kilitleme. Parola hash'i (scrypt) şifreli ayar
// deposunda saklanır; oturum durumu bellekte tutulur (uygulama kapanınca kilitlenir).
import { hashPassword, verifyPassword } from './encryption'
import {
  setSecureSetting,
  getSecureSetting,
  deleteSecureSetting
} from '../../db'

const KEY_HASH = 'session.passwordHash'
const KEY_SALT = 'session.passwordSalt'

let locked = false
let initialized = false

function ensureInitialized(): void {
  if (initialized) return
  locked = hasMasterPassword()
  initialized = true
}

// Ana parola tanımlı mı?
export function hasMasterPassword(): boolean {
  return getSecureSetting(KEY_HASH) !== null
}

// Oturum kilitli mi?
export function isLocked(): boolean {
  ensureInitialized()
  return locked
}

// İlk kez ana parola belirler (veya mevcutken doğrulayıp değiştirir).
export function setMasterPassword(password: string): void {
  const { salt, hash } = hashPassword(password)
  setSecureSetting(KEY_SALT, salt)
  setSecureSetting(KEY_HASH, hash)
  locked = false
  initialized = true
}

// Parolayı doğrular ve kilidi açar.
export function unlock(password: string): boolean {
  const salt = getSecureSetting(KEY_SALT)
  const hash = getSecureSetting(KEY_HASH)
  if (!salt || !hash) return false
  if (!verifyPassword(password, salt, hash)) return false
  locked = false
  initialized = true
  return true
}

// Oturumu kilitler.
export function lock(): void {
  locked = true
  initialized = true
}

// Ana parolayı doğrulayarak değiştirir.
export function changeMasterPassword(oldPassword: string, newPassword: string): boolean {
  if (!unlock(oldPassword)) return false
  setMasterPassword(newPassword)
  return true
}

// Ana parolayı kaldırır (kilit özelliğini devre dışı bırakır).
export function removeMasterPassword(password: string): boolean {
  if (!unlock(password)) return false
  deleteSecureSetting(KEY_HASH)
  deleteSecureSetting(KEY_SALT)
  locked = false
  return true
}

// Oturum durumunu renderer'a bildirmek için.
export function sessionState(): { hasPassword: boolean; locked: boolean } {
  ensureInitialized()
  return { hasPassword: hasMasterPassword(), locked }
}
