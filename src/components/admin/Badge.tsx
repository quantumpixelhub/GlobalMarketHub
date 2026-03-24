import React from 'react';

type BadgeColor = 'green' | 'red' | 'yellow' | 'blue' | 'purple' | 'orange';

interface BadgeProps {
  label: string;
  color: BadgeColor;
  size?: 'sm' | 'md';
}

const colorClasses: Record<BadgeColor, string> = {
  green: 'bg-green-100 text-green-800',
  red: 'bg-red-100 text-red-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  blue: 'bg-blue-100 text-blue-800',
  purple: 'bg-purple-100 text-purple-800',
  orange: 'bg-emerald-100 text-emerald-800',
};

const sizeClasses = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1 text-sm',
};

export default function Badge({ label, color, size = 'md' }: BadgeProps) {
  return (
    <span className={`font-medium rounded-full inline-block ${colorClasses[color]} ${sizeClasses[size]}`}>
      {label}
    </span>
  );
}
