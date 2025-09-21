import React from 'react';

interface GridBlockProps {
  className?: string;
  children?: React.ReactNode;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
}

// No specific styling required

export const GridBlock: React.FC<GridBlockProps> = ({
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

export default GridBlock;
