import { Outlet, NavLink } from 'react-router-dom'

export default function CreatorLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-6">
          <NavLink to="/" className="font-bold text-blue-600 text-lg">
            Easter Hunt
          </NavLink>
          <NavLink
            to="/creator"
            end
            className={({ isActive }) =>
              isActive ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-gray-900'
            }
          >
            Meine Spiele
          </NavLink>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
