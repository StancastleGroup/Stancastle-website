import React, { useState, useEffect } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps & HTMLMotionProps<"button">> = ({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  className = '',
  ...props 
}) => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);
  
  const baseStyles = "relative overflow-hidden font-bold transition-all duration-300 rounded-xl flex items-center justify-center gap-3 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 touch-manipulation";
  
  const variants = {
    primary: "bg-brand-accent text-white shadow-[0_10px_30px_rgba(217,70,239,0.3)] hover:shadow-[0_15px_40px_rgba(217,70,239,0.5)] border-0",
    secondary: "bg-white text-brand-dark hover:bg-gray-100 shadow-xl",
    outline: "border border-white/10 text-white hover:border-brand-accent hover:bg-brand-accent/5 backdrop-blur-md",
    ghost: "text-brand-muted hover:text-white hover:bg-white/5"
  };

  const sizes = {
    sm: "px-5 py-2.5 text-xs uppercase tracking-[0.15em]",
    md: "px-7 py-3.5 text-sm uppercase tracking-[0.2em]",
    lg: "px-10 py-5 text-base uppercase tracking-[0.25em]"
  };

  // Use regular button on mobile to avoid Framer Motion touch issues
  if (isMobile) {
    const { onClick, disabled, type, ...restProps } = props;
    return (
      <button
        type={type || 'button'}
        disabled={disabled}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        onClick={(e) => {
          if (disabled) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          if (onClick) {
            // Ensure onClick is called synchronously for mobile redirects
            onClick(e);
          }
        }}
        {...restProps}
      >
        <span className="relative z-10">{children}</span>
        {variant === 'primary' && (
          <div className="absolute inset-0 z-0 bg-gradient-to-r from-fuchsia-500 to-purple-600 opacity-0 hover:opacity-100 transition-opacity duration-500" />
        )}
      </button>
    );
  }

  return (
    <motion.button
      whileHover={{ y: -3 }}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      {variant === 'primary' && (
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-fuchsia-500 to-purple-600 opacity-0 hover:opacity-100 transition-opacity duration-500" />
      )}
      
      {/* Shine Effect */}
      <div className="absolute top-0 -left-[100%] w-[120%] h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[30deg] transition-all duration-700 group-hover:left-[100%]" />
    </motion.button>
  );
};