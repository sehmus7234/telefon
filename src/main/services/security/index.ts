// Güvenlik modülünün genel arayüzü (barrel).
export {
  encryptString,
  decryptString,
  encryptFile,
  decryptFile,
  isEncryptedBlob,
  hashPassword,
  verifyPassword,
  sha256Hex,
  deriveKey,
  randomBytesHex,
  ENC_FILE_HEADER_LENGTH
} from './encryption'
export { maskSensitive, maskImei, maskMac, maskObject, REDACTED } from './redact'
export { classifyCommand } from './dangerous'
export type { DangerousCommandInfo } from './dangerous'
export {
  getAdbKeyInfo,
  ensureAdbKey,
  rotateAdbKey,
  deleteAdbKey,
  keyExists,
  fingerprintMd5,
  fingerprintSha256
} from './adbKey'
export {
  initSecretStore,
  encryptSecret,
  decryptSecret,
  isSecretEncrypted,
  getSecretStorePath,
  setMasterKeyForTesting
} from './secretStore'
export {
  hasMasterPassword,
  isLocked,
  setMasterPassword,
  unlock,
  lock,
  changeMasterPassword,
  removeMasterPassword,
  sessionState
} from './session'
export {
  checkSecurityUpdates,
  parseAdvisories,
  semverLt,
  fetchSecurityAdvisories
} from './securityUpdates'
