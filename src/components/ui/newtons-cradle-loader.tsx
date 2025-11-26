import React from 'react';
import './newtons-cradle-loader.css';

interface NewtonsCradleLoaderProps {
  size?: number;
  speed?: number;
  color?: string;
  className?: string;
}

export function NewtonsCradleLoader({ 
  size = 50, 
  speed = 1.2, 
  color = '#474554',
  className = ''
}: NewtonsCradleLoaderProps) {
  const style = {
    '--uib-size': `${size}px`,
    '--uib-speed': `${speed}s`,
    '--uib-color': color,
  } as React.CSSProperties;

  return (
    <div className={`newtons-cradle ${className}`} style={style}>
      <div className="newtons-cradle__dot"></div>
      <div className="newtons-cradle__dot"></div>
      <div className="newtons-cradle__dot"></div>
      <div className="newtons-cradle__dot"></div>
    </div>
  );
}
