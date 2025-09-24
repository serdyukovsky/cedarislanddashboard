import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const quotes = [
  "Деньги не пахнут, но душат.",
  "Деньги это грязь, только лечебная",
  "Деньги — лучший клей для чужих улыбок.",
  "Деньги — тихий бог, шумный раб.",
  "Монета звонкая, совесть глухая.",
  "Деньги — оружие без крови, но с жертвами.",
  "Бумага горит, а власть остаётся."
];

export const ProfitQuotes: React.FC = () => {
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuoteIndex((prevIndex) => (prevIndex + 1) % quotes.length);
    }, 5000); // 5 секунд

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-right">
      <div className="max-w-md ml-auto min-h-[3rem] flex items-center justify-end">
        <AnimatePresence mode="wait">
          <motion.p
            key={currentQuoteIndex}
            initial={{ 
              opacity: 0, 
              y: 20, 
              scale: 0.9
            }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1
            }}
            exit={{ 
              opacity: 0, 
              y: -20, 
              scale: 0.9
            }}
            transition={{ 
              duration: 0.5,
              ease: "easeInOut"
            }}
            className="text-sm text-muted-foreground italic"
          >
            "{quotes[currentQuoteIndex]}"
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
};
