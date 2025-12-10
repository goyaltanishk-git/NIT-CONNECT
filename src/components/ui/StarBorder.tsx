import React from 'react';
import './StarBorder.css';

type StarBorderProps<T extends React.ElementType> = React.ComponentPropsWithoutRef<T> & {
  as?: T;
  className?: string;
  children?: React.ReactNode;
  color?: string;
  speed?: React.CSSProperties['animationDuration'];
};

const StarBorder = <T extends React.ElementType = 'div'>({
  as,
  className = '',
  color = 'cyan',
  speed = '6s',
  children,
  ...rest
}: StarBorderProps<T>) => {
  const Component = as || 'div';

  return (
    <Component
      className={`star-border-container ${className}`}
      {...(rest as any)}
    >
      <div
        className="border-gradient-bottom"
        style={{
          // Changed to transparent 3% for a sharper, smaller star head
          background: `radial-gradient(circle, ${color}, transparent 3%)`,
          animationDuration: speed
        }}
      ></div>
      <div
        className="border-gradient-top"
        style={{
          // Changed to transparent 3% here too
          background: `radial-gradient(circle, ${color}, transparent 3%)`,
          animationDuration: speed
        }}
      ></div>
      <div className="inner-content">{children}</div>
    </Component>
  );
};

export default StarBorder;