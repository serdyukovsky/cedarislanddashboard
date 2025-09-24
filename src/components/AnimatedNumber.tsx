import { useState, useEffect } from 'react';

interface AnimatedNumberProps {
  value: number;
  loading: boolean;
  className?: string;
  suffix?: string;
}

export function AnimatedNumber({ value, loading, className = "", suffix = "" }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (loading) {
      setIsAnimating(true);
      // Анимация "пересчета" с рандомными цифрами
      const interval = setInterval(() => {
        const randomValue = Math.floor(Math.random() * 1000000);
        setDisplayValue(randomValue);
      }, 100);

      return () => clearInterval(interval);
    } else {
      // Плавный переход к реальному значению
      const timeout = setTimeout(() => {
        setDisplayValue(value);
        setIsAnimating(false);
      }, 200);

      return () => clearTimeout(timeout);
    }
  }, [loading, value]);

  return (
    <div 
      className={`${className} ${loading ? 'blur-sm' : ''} ${isAnimating ? 'animate-pulse' : ''}`}
    >
      {displayValue.toLocaleString("ru-RU")}{suffix}
    </div>
  );
}
