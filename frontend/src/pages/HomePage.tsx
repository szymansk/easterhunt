import { useNavigate } from 'react-router-dom'

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-blue-500 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 shadow-lg text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Easter Hunt</h1>
        <p className="text-gray-600 mb-8">Willkommen zur Osterschnitzeljagd!</p>
        <div className="flex flex-col gap-4">
          <button
            onClick={() => navigate('/creator')}
            className="min-h-[60px] min-w-[200px] bg-green-500 text-white text-xl font-semibold rounded-lg px-6 py-3 hover:bg-green-600 transition-colors"
          >
            Spiel erstellen
          </button>
          <button
            onClick={() => navigate('/play')}
            className="min-h-[60px] min-w-[200px] bg-orange-500 text-white text-xl font-semibold rounded-lg px-6 py-3 hover:bg-orange-600 transition-colors"
          >
            Spiel spielen
          </button>
        </div>
      </div>
    </div>
  )
}
