import React from 'react';

export const Button = ({
  children,
  variant = 'secondary', // primary, secondary, ghost, danger, icon
  size = 'md', // sm, md, lg
  className = '',
  icon: Icon,
  disabled = false,
  type = 'button',
  onClick,
  title,
  ...props
}) => {
  const variantClass = `btn-${variant}`;
  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '';

  return (
    <button
      type={type}
      className={`${variantClass} ${sizeClass} ${className}`}
      disabled={disabled}
      onClick={onClick}
      title={title}
      {...props}
    >
      {Icon && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />}
      {children}
    </button>
  );
};
