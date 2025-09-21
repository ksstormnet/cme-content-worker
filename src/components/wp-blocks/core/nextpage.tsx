import React from 'react';

interface NextpageBlockProps {
  className?: string;
  children?: React.ReactNode;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
}

// No specific styling required

export const NextpageBlock: React.FC<NextpageBlockProps> = ({
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

export default NextpageBlock;
