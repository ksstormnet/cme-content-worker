import React from 'react';

interface HtmlBlockProps {
  className?: string;
  children?: React.ReactNode;
  content?: string;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
}

// No specific styling required

export const HtmlBlock: React.FC<HtmlBlockProps> = ({
  className,
  children,
  content,
  lock,
  metadata
}) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};

export default HtmlBlock;
