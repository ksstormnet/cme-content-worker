import React from 'react';

interface ImageBlockProps {
  className?: string;
  children?: React.ReactNode;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
  className?: string;
}

// No specific styling required

export const ImageBlock: React.FC<ImageBlockProps> = ({
  className,
  children,
  lock,
  metadata,
  className
}) => {
  return (
    <figure className={className}>
      {children}
    </figure>
  );
};

export default ImageBlock;
