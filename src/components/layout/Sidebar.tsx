import { motion } from 'framer-motion';
import {
  Command,
  LayoutDashboard,
  TrendingUp,
  Package,
  Users,
  Settings,
  ShoppingCart,
  BarChart3,
  Boxes
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

// Standard Dashboard Sections (on top)
const standardSections = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, highlight: true },
  { id: 'sales', label: 'Sales', icon: TrendingUp, highlight: true },
  { id: 'products', label: 'Products', icon: Package, highlight: true },
  { id: 'customers', label: 'Customers', icon: Users, highlight: true },
  { id: 'customizations', label: 'Customizations', icon: Settings, highlight: true }
];

// Intelligence/Strategic Sections (below standard)
const intelligenceSections = [
  { id: 'executive', label: 'Executive Center', icon: Command, highlight: true },
  { id: 'revenue-intelligence', label: 'Revenue Intelligence', icon: BarChart3, highlight: true },
  { id: 'product-catalog-health', label: 'Catalog Health', icon: Boxes, highlight: true }
];

const menuItems = [...standardSections, ...intelligenceSections];

export const Sidebar = ({ activeView, onViewChange }: SidebarProps) => {
  return (
    <motion.div 
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-64 bg-primary-secondary border-r border-button-dark h-screen fixed left-0 top-0 flex flex-col z-50"
    >
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="p-6 border-b border-button-dark"
      >
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ 
              type: 'spring',
              stiffness: 200,
              damping: 15
            }}
            className="w-10 h-10 bg-gradient-dark rounded-lg flex items-center justify-center relative overflow-hidden"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-accent/30 to-transparent"
              animate={{
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
            <ShoppingCart size={24} className="text-accent relative z-10" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-text-primary text-xl font-bold">IncStores</h1>
            <p className="text-text-muted text-xs">Analytics Dashboard</p>
          </motion.div>
        </div>
      </motion.div>

      <nav className="flex-1 p-4 overflow-y-auto">
        {/* Standard Dashboard Sections */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <motion.h3 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xs font-semibold text-text-muted uppercase mb-3 px-2"
          >
            Dashboard
          </motion.h3>
          <ul className="space-y-2">
            {standardSections.map((item, index) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;

              return (
                <motion.li
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.05 }}
                  whileHover={{ x: 6 }}
                >
                  <motion.button
                    onClick={() => onViewChange(item.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all relative overflow-hidden group ${
                      isActive
                        ? 'bg-accent text-white shadow-lg'
                        : 'text-text-primary bg-button-dark/50 hover:bg-button-dark border border-accent/30'
                    }`}
                  >
                    {/* Active background animation */}
                    {isActive && (
                      <motion.div
                        layoutId="activeBackground"
                        className="absolute inset-0 bg-accent rounded-lg"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                    
                    {/* Hover shine effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full"
                      transition={{ duration: 0.6 }}
                    />
                    
                    <motion.div
                      className="relative z-10 flex items-center gap-3 w-full"
                      animate={isActive ? { x: 0 } : {}}
                    >
                      <motion.div
                        animate={isActive ? { rotate: [0, 10, -10, 0] } : {}}
                        transition={{ duration: 0.5 }}
                      >
                        <Icon size={20} />
                      </motion.div>
                      <span className="font-medium">{item.label}</span>
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="ml-auto w-1.5 h-1.5 rounded-full bg-white"
                        />
                      )}
                    </motion.div>
                  </motion.button>
                </motion.li>
              );
            })}
          </ul>
        </motion.div>

        {/* Intelligence/Strategic Sections */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <motion.h3 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 }}
            className="text-xs font-semibold text-text-muted uppercase mb-3 px-2"
          >
            Intelligence
          </motion.h3>
          <ul className="space-y-2">
            {intelligenceSections.map((item, index) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;

              return (
                <motion.li
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.0 + index * 0.05 }}
                  whileHover={{ x: 6 }}
                >
                  <motion.button
                    onClick={() => onViewChange(item.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all relative overflow-hidden group ${
                      isActive
                        ? 'bg-accent text-white shadow-lg'
                        : 'text-text-primary bg-button-dark/50 hover:bg-button-dark border border-accent/30'
                    }`}
                  >
                    {/* Active background animation */}
                    {isActive && (
                      <motion.div
                        layoutId="activeBackgroundIntelligence"
                        className="absolute inset-0 bg-accent rounded-lg"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                    
                    {/* Hover shine effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full"
                      transition={{ duration: 0.6 }}
                    />
                    
                    <motion.div
                      className="relative z-10 flex items-center gap-3 w-full"
                      animate={isActive ? { x: 0 } : {}}
                    >
                      <motion.div
                        animate={isActive ? { rotate: [0, 10, -10, 0] } : {}}
                        transition={{ duration: 0.5 }}
                      >
                        <Icon size={20} />
                      </motion.div>
                      <span className="font-medium">{item.label}</span>
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="ml-auto w-1.5 h-1.5 rounded-full bg-white"
                        />
                      )}
                    </motion.div>
                  </motion.button>
                </motion.li>
              );
            })}
          </ul>
        </motion.div>
      </nav>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.3 }}
        className="p-4 border-t border-button-dark"
      >
        <div className="bg-button-dark rounded-lg p-4">
          <p className="text-text-secondary text-sm mb-2">Need help?</p>
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-accent text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors relative overflow-hidden group"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full"
              transition={{ duration: 0.6 }}
            />
            <span className="relative z-10">Contact Support</span>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};
