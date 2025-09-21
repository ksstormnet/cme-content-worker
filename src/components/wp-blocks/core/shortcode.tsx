import React from 'react';

interface ShortcodeBlockProps {
  className?: string;
  children?: React.ReactNode;
  text?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
}

// No specific styling required

export const ShortcodeBlock: React.FC<ShortcodeBlockProps> = ({
  className,
  children,
  text,
  lock,
  metadata
}) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};

export default ShortcodeBlock;
