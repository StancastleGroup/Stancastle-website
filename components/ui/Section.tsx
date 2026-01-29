import React from 'react';
import { motion } from 'framer-motion';

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
  return (
    <section 
      id={id}
      className={`py-12 md:py-20 relative overflow-hidden ${background === 'subtle' ? 'bg-brand-card/30' : ''} ${className}`}
    >
      <div className="container mx-auto px-4 md:px-6 relative z-10 flex flex-col items-center justify-center">
        <motion.div
          className="w-full flex flex-col items-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% " }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </div>
    </section>
  );
};
