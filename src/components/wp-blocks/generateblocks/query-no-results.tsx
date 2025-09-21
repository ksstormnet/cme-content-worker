import React from 'react';

interface QueryNoResultsBlockProps {
  className?: string;
  children?: React.ReactNode;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
}

// No specific styling required

export const QueryNoResultsBlock: React.FC<QueryNoResultsBlockProps> = ({
  className,
  children,
  lock,
  metadata
}) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};

export default QueryNoResultsBlock;
