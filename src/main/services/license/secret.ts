// Lisans HMAC imza anahtarı (çevrimdışı serial doğrulama).
// Bu anahtar uygulamada gömülü olduğu için tersine mühendislikle elde edilebilir;
// sahte serial üretmek bu anahtarı gerektirir. Daha güçlü koruma için ileride
// asimetrik (Ed25519) imzaya dönülebilir. Anahtar değişirse tüm serialler geçersiz olur.
export const LICENSE_SECRET = '21468c1d75e5e0152d4b073cbbdb66e2764d81939740654a603d880c0b62d2e2'
