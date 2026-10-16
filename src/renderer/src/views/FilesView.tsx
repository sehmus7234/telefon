import { useState } from 'react'
import SearchBar from '../components/ui/SearchBar'
import EmptyState from '../components/ui/EmptyState'

export default function FilesView() {
  const [arama, setArama] = useState('')
  return (
    <div className="space-y-4">
      <div className="max-w-xs">
        <SearchBar value={arama} onChange={setArama} placeholder="Dosya ara..." />
      </div>
      <EmptyState title="Dosya bulunamadı" description="Dosya gezgini henüz eklenmedi." />
    </div>
  )
}
