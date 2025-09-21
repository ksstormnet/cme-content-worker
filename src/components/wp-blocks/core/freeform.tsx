import React from 'react';

interface FreeformBlockProps {
  className?: string;
  children?: React.ReactNode;
  content?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
}

// No specific styling required

export const FreeformBlock: React.FC<FreeformBlockProps> = ({
  className,
  children,
  content,
  lock,
  metadata
}) => {
  return (
    <form className={className}>
      {children}
    </form>
  );
};

export default FreeformBlock;
