import { useParams } from 'react-router-dom'

export default function PlayerPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Osterschnitzeljagd</h1>
        <p className="text-gray-500">Spiel ID: {id}</p>
      </div>
    </div>
  )
}
