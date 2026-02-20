import { useNavigate, useLocation } from 'react-router-dom'
import { Home, LayoutGrid, Settings } from 'lucide-react'

const NAV_ITEMS = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/history', label: 'Collections', icon: LayoutGrid },
    { path: '/settings', label: 'Settings', icon: Settings },
]

export default function BottomNav() {
    const navigate = useNavigate()
    const location = useLocation()

    return (
        <div
            className="fixed z-40 left-1/2 -translate-x-1/2"
            style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
        >
            <div
                className="flex items-center gap-2 px-5 py-2 rounded-full"
                style={{
                    background: 'rgba(30, 30, 30, 0.85)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
                }}
            >
                {NAV_ITEMS.map((item) => {
                    const Icon = item.icon
                    const isActive = location.pathname === item.path
                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full transition-all"
                            style={{
                                background: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                            }}
                        >
                            <Icon
                                size={22}
                                className={isActive ? 'text-blue-400' : 'text-gray-400'}
                                strokeWidth={isActive ? 2.2 : 1.8}
                            />
                            <span
                                className={`text-[10px] font-medium ${isActive ? 'text-blue-400' : 'text-gray-400'
                                    }`}
                            >
                                {item.label}
                            </span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
