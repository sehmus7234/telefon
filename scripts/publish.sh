#!/usr/bin/env bash
# Açık kaynak yayın hazırlığı (prompt 180).
# PATRON yer tutucusunu gerçek GitHub hesabıyla değiştirir, remote ekler ve
# push/tag komutlarını hazırlar. Push, kimlik doğrulaması senin terminalinde
# yapılır (gh auth login veya token ile).
#
# Kullanım:
#   GITHUB_USER=kullanici bash scripts/publish.sh
#   bash scripts/publish.sh kullanici [repo]     (repo varsayılan: telefon)
set -euo pipefail

USERNAME="${1:-${GITHUB_USER:-}}"
REPO="${2:-telefon}"

if [ -z "$USERNAME" ]; then
  echo "HATA: GitHub kullanıcı adı gerekli." >&2
  echo "  GITHUB_USER=kullanici bash scripts/publish.sh" >&2
  echo "  bash scripts/publish.sh kullanici" >&2
  exit 1
fi

cd "$(dirname "$0")/.."

# 1) Yer tutucuyu yalnızca yapılandırma dosyalarında değiştir.
if grep -q 'PATRON' electron-builder.yml package.json; then
  sed -i "s/PATRON/${USERNAME}/g" electron-builder.yml package.json
  echo "✓ PATRON -> ${USERNAME}  (electron-builder.yml, package.json)"
else
  echo "• 'PATRON' bulunamadı (önceden değiştirilmiş olabilir)."
fi

# 2) Remote ekle (yoksa).
if git remote get-url origin >/dev/null 2>&1; then
  echo "• remote zaten var: $(git remote get-url origin)"
else
  git remote add origin "https://github.com/${USERNAME}/${REPO}.git"
  echo "✓ remote: origin -> https://github.com/${USERNAME}/${REPO}.git"
fi

# 3) Değişikliği commit et.
git add electron-builder.yml package.json
if git commit -m "chore: yayın yapılandırması (${USERNAME}/${REPO})"; then
  echo "✓ değişiklik commit edildi"
else
  echo "• commit edilecek değişiklik yok"
fi

# 4) Kullanıcının terminalinde çalıştıracağı adımlar.
cat <<EOF

== Sıradaki adımlar (kimlik doğrulamalı terminalde) ==
  gh auth login                # veya push sırasında kullanıcı adı+token
  git push -u origin main
  git tag v0.1.0
  git push --tags

Etiket itilince CI (build.yml) üç platform kurulumcusunu üretip GitHub Releases'a yükler.
EOF
