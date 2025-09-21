import React from 'react';

interface QueryLoopBlockProps {
  className?: string;
  children?: React.ReactNode;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
}

// No specific styling required

export const QueryLoopBlock: React.FC<QueryLoopBlockProps> = ({
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

export default QueryLoopBlock;
