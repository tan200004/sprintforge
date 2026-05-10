import { motion } from 'framer-motion';
import { Zap, Loader2 } from 'lucide-react';

const LoadingScreen = () => {
  return (
    <div className="gap-6 flex flex-col items-center justify-center min-h-screen bg-surface-950">
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ repeat: Infinity, ease: 'easeInOut', duration: 1.8 }}
        className="shadow-forge-glow items-center flex justify-center bg-forge-gradient rounded-2xl h-14 w-14"
      >
        <Zap className="h-7 w-7 text-white" />
      </motion.div>
      <div className="text-center">
        <p className="text-lg font-semibold text-surface-200">SprintForge</p>
        <p className="justify-center flex items-center gap-2 mt-1 text-sm text-surface-500">
          <Loader2 className="animate-spin h-3.5 w-3.5" /> Getting your space ready...
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;
