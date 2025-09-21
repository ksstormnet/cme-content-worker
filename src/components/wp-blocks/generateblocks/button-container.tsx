import React from 'react';

interface ButtonContainerBlockProps {
  className?: string;
  children?: React.ReactNode;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
}

// No specific styling required

export const ButtonContainerBlock: React.FC<ButtonContainerBlockProps> = ({
  className,
  children,
  lock,
  metadata,
  className
}) => {
  return (
    <button className={className}>
      {children}
    </button>
  );
};

export default ButtonContainerBlock;
