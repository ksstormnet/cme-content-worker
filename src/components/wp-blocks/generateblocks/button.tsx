import React from 'react';

interface ButtonBlockProps {
  className?: string;
  children?: React.ReactNode;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
}

// No specific styling required

export const ButtonBlock: React.FC<ButtonBlockProps> = ({
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

export default ButtonBlock;
