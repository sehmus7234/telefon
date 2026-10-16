import EmptyState from '../components/ui/EmptyState'
import { useNavStore } from '../store/useNavStore'

// Kullanıcı dostu hata sayfası (prompt 93): 404.
export default function NotFoundView() {
  const git = useNavStore((s) => s.git)
  return (
    <EmptyState
      title="404 — Sayfa bulunamadı"
      description="İstediğiniz sayfa mevcut değil veya taşınmış olabilir."
      action={
        <button className="btn-primary" onClick={() => git('dashboard')}>
          Dashboard'a dön
        </button>
      }
    />
  )
}
