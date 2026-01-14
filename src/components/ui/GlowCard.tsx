import React, { useEffect, useRef, ReactNode } from 'react';

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: 'blue' | 'purple' | 'green' | 'red' | 'orange';
  size?: 'sm' | 'md' | 'lg';
  width?: string | number;
  height?: string | number;
  customSize?: boolean;
}

// We keep the base at 330 (Pink) for all keys to ensure 
// no matter what prop is passed, the cycle stays Pink & White.
const glowColorMap = {
  blue: { base: 330, spread: 0 },
  purple: { base: 330, spread: 0 },
  green: { base: 330, spread: 0 },
  red: { base: 330, spread: 0 },
  orange: { base: 330, spread: 0 }
};

const sizeMap = {
  sm: 'w-48 h-64',
  md: 'w-64 h-80',
  lg: 'w-80 h-96'
};

const GlowCard: React.FC<GlowCardProps> = ({
  children,
  className = '',
  glowColor = 'purple',
  size = 'lg',
  width,
  height,
  customSize = false
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    let startTime = performance.now();
    const speed = 0.00055; // Adjust speed here

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      
      const w = card.offsetWidth;
      const h = card.offsetHeight;
      
      const cx = w / 2;
      const cy = h / 2;
      const rx = w / 2; 
      const ry = h / 2; 
      
      const angle = elapsed * speed;
      
      const x = cx + Math.cos(angle) * rx;
      const y = cy + Math.sin(angle) * ry;

      card.style.setProperty('--x', x.toFixed(2));
      card.style.setProperty('--y', y.toFixed(2));
      
      // xp goes 0 to 1 and back. We use this to transition color saturation.
      card.style.setProperty('--xp', ((Math.cos(angle) + 1) / 2).toFixed(2));
      card.style.setProperty('--yp', ((Math.sin(angle) + 1) / 2).toFixed(2));

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const { base, spread } = glowColorMap[glowColor];

  const getSizeClasses = () => {
    if (customSize) return '';
    return sizeMap[size];
  };

  const getInlineStyles = (): React.CSSProperties => {
    const baseStyles: any = {
      '--base': base,
      '--spread': spread,
      '--radius': '24',
      '--border': '2',
      '--backdrop': 'transparent',
      '--backup-border': 'var(--backdrop)',
      '--size': '200',
      '--outer': '1',
      '--border-size': 'calc(var(--border, 2) * 1px)',
      '--spotlight-size': 'calc(var(--size, 150) * 1px)',
      
      // DYNAMIC COLOR LOGIC
      '--hue': '330', // Forced to Pink
      '--saturation': 'calc(100 - (var(--xp, 0) * 100))', // Cycles 100% to 0% (White)
      '--lightness': 'calc(70 + (var(--xp, 0) * 30))',   // Cycles 70% to 100% (White)
      
      backgroundImage: `radial-gradient(
        var(--spotlight-size) var(--spotlight-size) at
        calc(var(--x, 0) * 1px)
        calc(var(--y, 0) * 1px),
        hsl(var(--hue) calc(var(--saturation) * 1%) calc(var(--lightness) * 1%) / var(--bg-spot-opacity, 0.1)), transparent
      )`,
      backgroundColor: 'transparent',
      backgroundSize: 'calc(100% + (2 * var(--border-size))) calc(100% + (2 * var(--border-size)))',
      backgroundPosition: '50% 50%',
      border: 'var(--border-size) solid var(--backup-border)',
      position: 'relative',
      touchAction: 'none',
    };

    if (width !== undefined) {
      baseStyles.width = typeof width === 'number' ? `${width}px` : width;
    }
    if (height !== undefined) {
      baseStyles.height = typeof height === 'number' ? `${height}px` : height;
    }

    return baseStyles as React.CSSProperties;
  };

  const beforeAfterStyles = `
    [data-glow]::before,
    [data-glow]::after {
      pointer-events: none;
      content: "";
      position: absolute;
      inset: calc(var(--border-size) * -1);
      border: var(--border-size) solid transparent;
      border-radius: calc(var(--radius) * 1px);
      background-size: calc(100% + (2 * var(--border-size))) calc(100% + (2 * var(--border-size)));
      background-repeat: no-repeat;
      background-position: 50% 50%;
      mask: linear-gradient(transparent, transparent), linear-gradient(white, white);
      mask-clip: padding-box, border-box;
      mask-composite: intersect;
    }
    
    [data-glow]::before {
      background-image: radial-gradient(
        calc(var(--spotlight-size) * 0.75) calc(var(--spotlight-size) * 0.75) at
        calc(var(--x, 0) * 1px)
        calc(var(--y, 0) * 1px),
        hsl(var(--hue) calc(var(--saturation) * 1%) calc(var(--lightness) * 1%) / var(--border-spot-opacity, 1)), transparent 100%
      );
      filter: brightness(1.8);
    }
    
    [data-glow]::after {
      background-image: radial-gradient(
        calc(var(--spotlight-size) * 0.5) calc(var(--spotlight-size) * 0.5) at
        calc(var(--x, 0) * 1px)
        calc(var(--y, 0) * 1px),
        hsl(0 100% 100% / var(--border-light-opacity, 1)), transparent 100%
      );
      /* Extra brightness boost during the white phase */
      opacity: var(--xp, 0.5);
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: beforeAfterStyles }} />
      <div
        ref={cardRef}
        data-glow
        style={getInlineStyles()}
        className={`
          ${getSizeClasses()}
          ${!customSize ? 'aspect-[3/4]' : ''}
          rounded-3xl  
          relative 
          block        
          p-0          
          ${className}
        `}
      >
        {children}
      </div>
    </>
  );
};

export { GlowCard };