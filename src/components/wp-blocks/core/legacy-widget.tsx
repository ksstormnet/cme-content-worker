import React from 'react';

interface LegacyWidgetBlockProps {
  className?: string;
  children?: React.ReactNode;
  id?: string;
  idBase?: string;
  instance?: Record<string, any>;
  lock?: Record<string, any>;
  metadata?: Record<string, any>;
}

// No specific styling required

export const LegacyWidgetBlock: React.FC<LegacyWidgetBlockProps> = ({
  className,
  children,
  id,
  idBase,
  instance,
  lock,
  metadata
}) => {
  // Medium complexity component - customize as needed
  const blockProps = {
    className,
    ...{id, idBase, instance, lock, metadata}
  };

  return (
    <div className={className}>
      {children}
    </div>
  );
};

export default LegacyWidgetBlock;
