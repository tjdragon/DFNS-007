import { Link } from 'react-router-dom'
import { Landmark, Users, ArrowRight, ShieldCheck, Zap, Globe } from 'lucide-react'

export default function WelcomePage() {
    return (
        <div className="relative overflow-hidden">
            {/* Hero Section */}
            <section className="relative pt-20 pb-16 lg:pt-32 lg:pb-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight text-gray-900 mb-6">
                            Institutional Bond Issuance, <span className="text-blue-600">Reimagined.</span>
                        </h1>
                        <p className="text-xl text-gray-500 leading-relaxed mb-10">
                            A secure, transparent, and efficient platform for bonds, powered by DFNS.
                            Streamlining the lifecycle of corporate and institutional debt.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                            <a href="#persona-selection" className="px-8 py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all transform hover:-translate-y-1">
                                Get Started
                            </a>
                            <a href="https://dfns.co" target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-white text-gray-900 font-bold rounded-xl border border-gray-200 hover:bg-gray-50 transition-all">
                                Learn about DFNS
                            </a>
                        </div>
                    </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
                        <div className="p-8 bg-gray-50 rounded-2xl border border-gray-100 card-hover">
                            <div className="bg-blue-100 p-3 rounded-xl w-fit mb-6">
                                <ShieldCheck className="w-6 h-6 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Institutional Security</h3>
                            <p className="text-gray-500">Built on top of DFNS MPC wallet infrastructure for maximum security and compliance.</p>
                        </div>
                        <div className="p-8 bg-gray-50 rounded-2xl border border-gray-100 card-hover">
                            <div className="bg-emerald-100 p-3 rounded-xl w-fit mb-6">
                                <Zap className="w-6 h-6 text-emerald-600" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Instant Settlement</h3>
                            <p className="text-gray-500">Blockchain-powered settlement reduces counterparty risk and operational friction.</p>
                        </div>
                        <div className="p-8 bg-gray-50 rounded-2xl border border-gray-100 card-hover">
                            <div className="bg-purple-100 p-3 rounded-xl w-fit mb-6">
                                <Globe className="w-6 h-6 text-purple-600" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Global Access</h3>
                            <p className="text-gray-500">Deploy bonds that are accessible to investors worldwide with minimal gatekeeping.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Persona Selection */}
            <section id="persona-selection" className="py-24 bg-gray-50 border-t border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Choose Your Persona</h2>
                        <p className="text-gray-500 max-w-2xl mx-auto text-lg">
                            Select how you would like to interact with the platform today.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
                        {/* Issuer Card */}
                        <div className="bg-white p-10 rounded-3xl shadow-xl shadow-gray-200 border border-gray-100 flex flex-col items-center text-center card-hover">
                            <div className="bg-blue-600 p-5 rounded-2xl mb-8 transform -rotate-6">
                                <Landmark className="w-10 h-10 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4">Bond Issuer</h3>
                            <p className="text-gray-500 mb-10 leading-relaxed text-lg">
                                Create new bond offerings, manage your issuance, and distribute coupons to your investors.
                            </p>
                            <Link
                                to="/issuer"
                                className="mt-auto flex items-center space-x-2 text-blue-600 font-bold text-lg hover:translate-x-1 transition-transform"
                            >
                                <span>Launch Issuer Portal</span>
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>

                        {/* Investor Card */}
                        <div className="bg-white p-10 rounded-3xl shadow-xl shadow-gray-200 border border-gray-100 flex flex-col items-center text-center card-hover">
                            <div className="bg-emerald-500 p-5 rounded-2xl mb-8 transform rotate-6">
                                <Users className="w-10 h-10 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4">Bond Investor</h3>
                            <p className="text-gray-500 mb-10 leading-relaxed text-lg">
                                Discover active bond offerings, subscribe to new issues, and track your interest earnings.
                            </p>
                            <Link
                                to="/investor"
                                className="mt-auto flex items-center space-x-2 text-emerald-500 font-bold text-lg hover:translate-x-1 transition-transform"
                            >
                                <span>Launch Investor Portal</span>
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
