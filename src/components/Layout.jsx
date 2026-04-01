import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/', label: 'Inventory' },
  { to: '/shopping', label: 'Shopping List' },
  { to: '/scan', label: 'Scan Receipt' },
  { to: '/receipts', label: 'Receipts' },
  { to: '/locations', label: 'Locations' },
  { to: '/members', label: 'Members' },
]

export default function Layout({ children }) {
  const { household, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Kitchen Inventory</h1>
          {household && <p className="text-xs text-gray-500">{household.name}</p>}
        </div>
        <button onClick={signOut} className="text-sm text-gray-500 hover:text-gray-700">
          Sign out
        </button>
      </header>

      <nav className="bg-white border-b border-gray-200 px-4 flex gap-1 overflow-x-auto">
        {navItems.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `px-3 py-3 text-sm whitespace-nowrap border-b-2 transition-colors ${
                isActive
                  ? 'border-green-600 text-green-700 font-medium'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
