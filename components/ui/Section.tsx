import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  background?: 'default' | 'subtle';
}

export const Section: React.FC<SectionProps> = ({ 
  children, 
  className = '', 
  id,
  background = 'default' 
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);
  
  return (
    <section 
      id={id}
      ref={ref}
      className={`py-8 md:py-14 relative overflow-hidden ${background === 'subtle' ? 'bg-brand-card/30' : ''} ${className}`}
    >
      <div className="container mx-auto px-4 md:px-6 relative z-10 flex flex-col items-center justify-center">
        {isMobile ? (
          // On mobile, skip animation for better performance
          <div className="w-full flex flex-col items-center">
            {children}
          </div>
        ) : (
          <motion.div
            className="w-full flex flex-col items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        )}
      </div>
    </section>
  );
};
