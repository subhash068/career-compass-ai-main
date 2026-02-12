import { useEffect, useState, useRef, useCallback } from 'react';

interface AnimatedNumberProps {
  target: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
  startOnView?: boolean;
}

export function AnimatedNumber({
  target,
  suffix = '',
  prefix = '',
  duration = 2000,
  className = '',
  startOnView = true,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const easeOutQuart = (t: number): number => {
    return 1 - Math.pow(1 - t, 4);
  };

  const startAnimation = useCallback(() => {
    if (hasAnimated) return;
    
    const startTime = performance.now();
    const startValue = 0;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuart(progress);
      
      const current = Math.floor(startValue + (target - startValue) * easedProgress);
      setDisplayValue(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(target);
        setHasAnimated(true);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
  }, [target, duration, hasAnimated]);

  useEffect(() => {
    if (!startOnView) {
      startAnimation();
      return;
    }

    const element = elementRef.current;
    if (!element) return;

    // Check if element is already in view
    const rect = element.getBoundingClientRect();
    const isInView = rect.top < window.innerHeight && rect.bottom > 0;
    
    if (isInView && !hasAnimated) {
      startAnimation();
      return;
    }

    // Set up intersection observer for elements not yet in view
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            startAnimation();
            observer.unobserve(entry.target);
          }
        });
      },
      { 
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [startAnimation, hasAnimated, startOnView]);

  // Format large numbers
  const formatNumber = (num: number): string => {
    if (suffix.includes('K') && target >= 1000) {
      return Math.floor(num / 1000).toString();
    }
    return num.toString();
  };

  const displaySuffix = suffix.includes('K') ? 'K+' : suffix;

  return (
    <div ref={elementRef} className={`tabular-nums ${className}`}>
      {prefix}
      {formatNumber(displayValue)}
      {displaySuffix}
    </div>
  );
}

// Rolling counter with slot machine effect
interface RollingNumberProps {
  target: number;
  suffix?: string;
  duration?: number;
  className?: string;
}

export function RollingNumber({
  target,
  suffix = '',
  duration = 2500,
  className = '',
}: RollingNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);
            
            const startTime = performance.now();
            let lastRandomUpdate = 0;
            
            const animate = (currentTime: number) => {
              const elapsed = currentTime - startTime;
              const progress = Math.min(elapsed / duration, 1);
              
              // Easing
              const easeOutQuart = 1 - Math.pow(1 - progress, 4);
              const baseValue = Math.floor(target * easeOutQuart);
              
              // Add rolling effect with random variations during animation
              if (progress < 0.85 && currentTime - lastRandomUpdate > 50) {
                const randomOffset = Math.floor(Math.random() * Math.min(5, target * 0.1));
                setDisplayValue(Math.min(baseValue + randomOffset, target));
                lastRandomUpdate = currentTime;
              } else {
                setDisplayValue(baseValue);
              }

              if (progress < 1) {
                rafRef.current = requestAnimationFrame(animate);
              } else {
                setDisplayValue(target);
              }
            };

            rafRef.current = requestAnimationFrame(animate);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [target, duration, hasAnimated]);

  const formatNumber = (num: number): string => {
    if (suffix.includes('K') && target >= 1000) {
      return Math.floor(num / 1000).toString();
    }
    return num.toString();
  };

  const displaySuffix = suffix.includes('K') ? 'K+' : suffix;

  return (
    <div ref={elementRef} className={`tabular-nums ${className}`}>
      {formatNumber(displayValue)}
      {displaySuffix}
    </div>
  );
}
