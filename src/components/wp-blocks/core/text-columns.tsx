import React from 'react';

interface TextColumnsBlockProps {
  className?: string;
  children?: React.ReactNode;
  content?: any[];
  columns?: number;
  width?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
}

// No specific styling required

export const TextColumnsBlock: React.FC<TextColumnsBlockProps> = ({
  className,
  children,
  content,
  columns,
  width,
  lock,
  metadata,
  className
}) => {
  // Medium complexity component - customize as needed
  const blockProps = {
    className,
    ...{content, columns, width, lock, metadata, className}
  };

  return (
    <p className={className}>
      {children}
    </p>
  );
};

export default TextColumnsBlock;
