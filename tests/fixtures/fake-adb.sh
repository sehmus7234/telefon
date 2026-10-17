#!/usr/bin/env bash
# Sahte adb ikilisi (prompt 162) — gerçek cihaz/adb olmadan servisleri test eder.
# exec.ts bu ikiliyi `ADB_PATH=/yol/fake-adb.sh` ile spawn eder; bilinen alt
# komutlara karşılık hazır çıktılar üretir.
# Not: bash gerektirir (Linux/macOS + CI ubuntu-latest üzerinde çalışır).

set -u

# `-l` bayrağı `devices -l` çıktısında öznitelik açar.
has_l=0
for a in "$@"; do
  [ "$a" = "-l" ] && has_l=1
done

# İlk gerçek alt komutu ve kalan argümanları ayır.
# `-s <serial>` çifti atlanır; `-e`/`-d`/`-l` tek başına bayraklar atlanır.
cmd=""
rest=()
skip_next=0
for a in "$@"; do
  if [ "$skip_next" = "1" ]; then
    skip_next=0
    continue
  fi
  case "$a" in
    -s) skip_next=1 ;;
    -e | -d | -l) ;;
    *)
      if [ -z "$cmd" ]; then
        cmd="$a"
      else
        rest+=("$a")
      fi
      ;;
  esac
done

case "$cmd" in
  version)
    echo "Android Debug Bridge version 1.0.41"
    echo "Version 35.0.2-12180518"
    exit 0
    ;;
  devices)
    echo "List of devices attached"
    if [ "$has_l" = "1" ]; then
      echo "emulator-5554          device product:sdk_gphone64_x86_64 model:Pixel_7 device:emu64a transport_id:1"
      echo "192.168.1.42:5555      device product:raven model:Pixel_6 device:raven transport_id:2"
    else
      echo "emulator-5554          device"
      echo "192.168.1.42:5555      device"
    fi
    exit 0
    ;;
  get-state)
    echo "device"
    exit 0
    ;;
  shell)
    sub="${rest[0]:-}"
    case "$sub" in
      echo)
        # `adb shell echo hello world` -> "hello world"
        printf '%s\n' "${rest[@]:1}"
        exit 0
        ;;
      getprop)
        case "${rest[1]:-}" in
          ro.product.model) echo "Pixel_7" ;;
          ro.product.manufacturer) echo "Google" ;;
          ro.build.version.release) echo "14" ;;
          ro.build.version.sdk) echo "34" ;;
          *) echo "" ;;
        esac
        exit 0
        ;;
      *)
        echo "sh: $sub: not found" >&2
        exit 127
        ;;
    esac
    ;;
  sleep-loop)
    # Zaman aşımı testi: dış süreç üretmeden uzun süre meşgul olur.
    # (Harici `sleep` stdin/stdout'u miras alıp spawn'ın `close` olayını
    # geciktirirdi; $SECONDS bash yerleşiğidir, çocuk süreç açmaz.)
    end=$((SECONDS + 60))
    while [ $SECONDS -lt $end ]; do :; done
    exit 0
    ;;
  fail-cmd)
    echo "device not found" >&2
    exit 1
    ;;
  *)
    echo "adb: unknown command $cmd" >&2
    exit 1
    ;;
esac
