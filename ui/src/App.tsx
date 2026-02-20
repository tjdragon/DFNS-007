import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import WelcomePage from '@/pages/WelcomePage'
import IssuerPage from '@/pages/IssuerPage'
import InvestorPage from '@/pages/InvestorPage'
import Layout from '@/components/Layout'

function App() {
    return (
        <Router basename={import.meta.env.BASE_URL}>
            <Layout>
                <Routes>
                    <Route path="/" element={<WelcomePage />} />
                    <Route path="/issuer" element={<IssuerPage />} />
                    <Route path="/investor" element={<InvestorPage />} />
                </Routes>
            </Layout>
        </Router>
    )
}

export default App
