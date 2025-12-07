import React from 'react';
import { audioService } from '../services/audioService';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'neutral' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  icon,
  onClick,
  ...props 
}) => {
  
  const baseStyles = "inline-flex items-center justify-center rounded-full font-bold transition-transform active:scale-95 shadow-md focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-candy-pink hover:bg-candy-darkPink text-white border-b-4 border-candy-darkPink",
    secondary: "bg-candy-mint hover:bg-candy-darkMint text-candy-text border-b-4 border-candy-darkMint",
    neutral: "bg-white hover:bg-gray-50 text-candy-text border border-gray-200",
    danger: "bg-red-400 hover:bg-red-500 text-white border-b-4 border-red-600",
  };

  const sizes = {
    sm: "px-3 py-1 text-sm",
    md: "px-6 py-3 text-lg",
    lg: "px-8 py-4 text-xl",
    xl: "px-10 py-6 text-3xl w-full",
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Play sound globally via service (service checks enabled state)
    audioService.play('click');
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={handleClick}
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};