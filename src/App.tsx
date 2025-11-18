import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Chatbot } from './components/Chatbot';
import { ExecutiveCenter } from './pages/ExecutiveCenter';
import { Dashboard } from './pages/Dashboard';
import { Sales } from './pages/Sales';
import { Products } from './pages/Products';
import { Customers } from './pages/Customers';
import { Customizations } from './pages/Customizations';
import { RevenueIntelligence } from './pages/RevenueIntelligence';
import { ProductCatalogHealth } from './pages/ProductCatalogHealth';
import { B2BIntelligence } from './pages/B2BIntelligence';

function App() {
  const [activeView, setActiveView] = useState('dashboard');

  const renderView = () => {
    switch (activeView) {
      case 'executive':
        return <ExecutiveCenter />;
      case 'dashboard':
        return <Dashboard />;
      case 'revenue-intelligence':
        return <RevenueIntelligence />;
      case 'product-catalog-health':
        return <ProductCatalogHealth />;
      case 'b2b-intelligence':
        return <B2BIntelligence />;
      case 'sales':
        return <Sales />;
      case 'products':
        return <Products />;
      case 'customers':
        return <Customers />;
      case 'customizations':
        return <Customizations />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-primary-bg">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      <div className="ml-64">
        <Header />
        <main className="pt-24 px-8 pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.98 }}
              transition={{ 
                duration: 0.4,
                ease: [0.22, 1, 0.36, 1]
              }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <Chatbot />
    </div>
  );
}

export default App;
