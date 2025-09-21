import React from 'react';

interface MatomoOptOutBlockProps {
  className?: string;
  children?: React.ReactNode;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
}

// No specific styling required

export const MatomoOptOutBlock: React.FC<MatomoOptOutBlockProps> = ({
  className,
  children,
  lock,
  metadata,
  className
}) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};

export default MatomoOptOutBlock;
