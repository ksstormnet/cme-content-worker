import React from 'react';

interface ContainerBlockProps {
  className?: string;
  children?: React.ReactNode;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
}

// No specific styling required

export const ContainerBlock: React.FC<ContainerBlockProps> = ({
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

export default ContainerBlock;
