import { motion } from 'framer-motion';

const SkeletonLoader = ({ extraStyles = '' }) => {
  // simple div to show loading pulse
  return (
    <div className={`animate-pulse rounded-lg bg-surface-800 ${extraStyles}`} />
  );
};
export default SkeletonLoader;

export const CardSkeleton = () => {
  return (
    <div className="space-y-3 p-5 forge-card">
      <SkeletonLoader extraStyles="w-1/2 h-4" />
      <SkeletonLoader extraStyles="w-3/4 h-8" />
      <SkeletonLoader extraStyles="w-full h-3" />
      <SkeletonLoader extraStyles="w-4/5 h-3" />
    </div>
  );
};

export const StatCardSkeleton = () => {
  return (
    <div className="space-y-3 p-5 forge-card">
      <div className="justify-between flex items-center">
        <SkeletonLoader extraStyles="w-24 h-4" />
        <SkeletonLoader extraStyles="w-8 h-8 rounded-lg" />
      </div>
      <SkeletonLoader extraStyles="w-20 h-8" />
      <SkeletonLoader extraStyles="w-32 h-3" />
    </div>
  );
};

export const TableRowSkeleton = ({ numColumns = 4 }) => {
  // loop to make td elements
  let dummyArray = Array.from({ length: numColumns });
  
  return (
    <tr>
      {dummyArray.map((notUsed, indexNum) => (
        <td key={indexNum} className="py-3 px-4">
          <SkeletonLoader extraStyles="w-full h-4" />
        </td>
      ))}
    </tr>
  );
};
