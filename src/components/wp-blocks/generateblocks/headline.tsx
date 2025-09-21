import React from 'react';

interface HeadlineBlockProps {
  className?: string;
  children?: React.ReactNode;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
}

// No specific styling required

export const HeadlineBlock: React.FC<HeadlineBlockProps> = ({
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

export default HeadlineBlock;
