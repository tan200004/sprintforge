import { motion } from 'framer-motion';

const EmptyState = ({ icon: TheIcon, title: headingText, description: subText, action: customButton }) => {
  return (
    <motion.div
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="text-center px-6 py-20 flex justify-center items-center flex-col"
    >
      {TheIcon && (
        <div className="mb-5 flex justify-center items-center border-surface-700 border bg-surface-800 rounded-2xl h-16 w-16">
          <TheIcon className="text-surface-500 h-8 w-8" />
        </div>
      )}
      <h3 className="mb-2 text-surface-200 font-semibold text-lg">{headingText}</h3>
      {subText && (
        <p className="mb-6 max-w-sm text-sm text-surface-500">{subText}</p>
      )}
      {customButton && customButton}
    </motion.div>
  );
};

export default EmptyState;
