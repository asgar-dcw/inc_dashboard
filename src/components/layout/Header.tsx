import { motion } from 'framer-motion';
import { Search, Bell, User } from 'lucide-react';
import { format } from 'date-fns';

export const Header = () => {
  const currentDate = format(new Date(), 'EEEE, MMMM d, yyyy');

  return (
    <div className="bg-primary-secondary border-b border-button-dark px-8 py-4 fixed top-0 right-0 left-64 z-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-text-primary text-2xl font-bold">Dashboard</h2>
          <p className="text-text-muted text-sm">{currentDate}</p>
        </div>

        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="relative"
          >
            <Search
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted"
            />
            <input
              type="text"
              placeholder="Search..."
              className="bg-button-dark text-text-primary pl-10 pr-4 py-2 rounded-lg border border-button-darkAlt focus:outline-none focus:border-accent w-64 text-sm"
            />
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="relative p-2 rounded-lg hover:bg-button-dark transition-colors"
          >
            <Bell size={20} className="text-text-secondary" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full"></span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 bg-button-dark px-3 py-2 rounded-lg hover:bg-button-darkAlt transition-colors"
          >
            <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
              <User size={18} className="text-white" />
            </div>
            <span className="text-text-primary text-sm font-medium">Admin</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
};
