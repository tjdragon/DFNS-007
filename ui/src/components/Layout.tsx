import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Building2, Wallet } from 'lucide-react'

interface LayoutProps {
    children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
    const location = useLocation()

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center space-x-2">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <span className="font-bold text-xl tracking-tight text-gray-900">DFNS <span className="text-blue-600">Bonds</span></span>
                    </Link>

                    <nav className="flex space-x-8">
                        <Link
                            to="/issuer"
                            className={`text-sm font-medium transition-colors ${location.pathname === '/issuer' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            Issuer Portal
                        </Link>
                        <Link
                            to="/investor"
                            className={`text-sm font-medium transition-colors ${location.pathname === '/investor' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            Investor Portal
                        </Link>
                    </nav>

                    <div className="flex items-center space-x-4">
                        {/* We'll add Wallet connection button here later */}
                    </div>
                </div>
            </header>

            <main className="flex-grow">
                {children}
            </main>

            <footer className="bg-white border-t border-gray-200 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-center justify-between">
                        <div className="flex items-center space-x-2 mb-4 md:mb-0">
                            <Building2 className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-500 text-sm font-medium">© 2026 DFNS Bond Issuance Platform. All rights reserved.</span>
                        </div>
                        <div className="flex space-x-6">
                            <a href="#" className="text-gray-400 hover:text-gray-500 text-sm">Terms</a>
                            <a href="#" className="text-gray-400 hover:text-gray-500 text-sm">Privacy</a>
                            <a href="#" className="text-gray-400 hover:text-gray-500 text-sm">Support</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
