import { useParams } from 'react-router-dom'

export default function GameEditorPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Spiel bearbeiten</h1>
      <p className="text-gray-500">Game ID: {id}</p>
    </div>
  )
}
