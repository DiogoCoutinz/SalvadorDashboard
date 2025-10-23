import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Vendedores from './pages/Vendedores'
import Clientes from './pages/Clientes'
import Familias from './pages/Familias'
import DetalheEntidade from './pages/DetalheEntidade'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/vendedores" element={<Vendedores />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/familias" element={<Familias />} />
          <Route path="/detalhe" element={<DetalheEntidade />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App

