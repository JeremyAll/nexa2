'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils.js';

// === PREMIUM BUTTON COMPONENT ===
export function PremiumButton({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className,
  onClick,
}) {
  const baseClasses = 'relative overflow-hidden rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105';

  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700',
    secondary: 'bg-white/10 backdrop-blur-sm border border-white/20 text-gray-800 dark:text-white hover:bg-white/20',
    ghost: 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-white/10',
    gradient: 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white animate-gradient-x'
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
    xl: 'px-12 py-5 text-xl'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        disabled && 'opacity-50 cursor-not-allowed',
        loading && 'cursor-wait',
        className
      )}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}
      <span className={cn('relative z-10', loading && 'opacity-0')}>
        {children}
      </span>
    </button>
  );
}

// === GLASS CARD COMPONENT ===
export function GlassCard({
  children,
  variant = 'default',
  padding = 'md',
  animated = false,
  className,
}) {
  const baseClasses = 'rounded-2xl transition-all duration-300 backdrop-blur-sm';

  const variantClasses = {
    default: 'bg-white/10 border border-white/20',
    dark: 'bg-gray-900/50 border border-gray-700/50',
    gradient: 'bg-gradient-to-br from-white/10 to-white/5 border border-white/20'
  };

  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-12'
  };

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        paddingClasses[padding],
        animated && 'hover:scale-105 hover:shadow-xl',
        className
      )}
    >
      {children}
    </div>
  );
}

// === FLOATING ORBS COMPONENT ===
export function FloatingOrbs() {
  const [orbs, setOrbs] = useState([]);

  useEffect(() => {
    const orbsData = Array.from({ length: 5 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 4,
    }));
    setOrbs(orbsData);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      {orbs.map((orb) => (
        <div
          key={orb.id}
          className="absolute w-64 h-64 rounded-full bg-gradient-to-r from-blue-400/20 to-purple-600/20 animate-pulse blur-xl"
          style={{
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            animationDelay: `${orb.delay}s`,
            transform: `translate(-50%, -50%)`,
            animation: `float ${6 + orb.delay}s ease-in-out infinite`
          }}
        />
      ))}
    </div>
  );
}

// === PREMIUM INPUT COMPONENT ===
export function PremiumInput({
  label,
  placeholder,
  type = 'text',
  value,
  onChange,
  error,
  className,
  disabled
}) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          className={cn(
            'w-full px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20',
            'placeholder:text-gray-500 dark:placeholder:text-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50',
            'transition-all duration-300',
            'hover:bg-white/20 focus:bg-white/25',
            error && 'border-red-500 focus:ring-red-500/50',
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
        />
        {error && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

// === GRADIENT TEXT COMPONENT ===
export function GradientText({
  children,
  gradient = 'premium',
  className,
  animated = false
}) {
  const gradientClasses = {
    premium: 'bg-gradient-to-r from-blue-600 to-purple-600',
    aurora: 'bg-gradient-to-r from-green-400 to-blue-500',
    cosmic: 'bg-gradient-to-r from-purple-400 to-pink-400',
    sunset: 'bg-gradient-to-r from-orange-400 to-red-400'
  };

  return (
    <span
      className={cn(
        'bg-clip-text text-transparent',
        gradientClasses[gradient],
        animated && 'animate-pulse',
        className
      )}
    >
      {children}
    </span>
  );
}

// === LOADING SPINNER COMPONENT ===
export function LoadingSpinner({
  size = 'md',
  variant = 'default',
  className
}) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  };

  const variantClasses = {
    default: 'border-gray-300 border-t-blue-600',
    gradient: 'border-transparent border-t-transparent'
  };

  if (variant === 'gradient') {
    return (
      <div className={cn('relative', sizeClasses[size], className)}>
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-spin" />
        <div className="absolute inset-1 rounded-full bg-white dark:bg-gray-900" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-full animate-spin',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    />
  );
}

// === NOTIFICATION COMPONENT ===
export function Notification({
  type,
  title,
  message,
  onClose,
  autoClose = true,
  duration = 5000
}) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  const typeConfig = {
    success: { color: 'text-green-600', bg: 'bg-green-500/20', border: 'border-green-500/30' },
    error: { color: 'text-red-600', bg: 'bg-red-500/20', border: 'border-red-500/30' },
    warning: { color: 'text-yellow-600', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' },
    info: { color: 'text-blue-600', bg: 'bg-blue-500/20', border: 'border-blue-500/30' }
  };

  const config = typeConfig[type];

  return (
    <div
      className={cn(
        'bg-white/10 backdrop-blur-sm rounded-xl p-4 border transition-all duration-300',
        config.bg,
        config.border,
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      )}
    >
      <div className="flex items-start">
        <div className="flex-1">
          {title && (
            <h4 className={cn('font-semibold mb-1', config.color)}>
              {title}
            </h4>
          )}
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {message}
          </p>
        </div>
        {onClose && (
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => onClose(), 300);
            }}
            className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// === PROGRESSIVE REVEAL COMPONENT ===
export function ProgressiveReveal({
  children,
  delay = 0,
  className
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={cn(
        'transition-all duration-700',
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-8',
        className
      )}
    >
      {children}
    </div>
  );
}