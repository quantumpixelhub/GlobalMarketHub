import React from 'react';
import { LucideIcon } from 'lucide-react';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
}

export default function AdminHeader({
  title,
  subtitle,
  icon: Icon,
  action,
}: AdminHeaderProps) {
  const ActionIcon = action?.icon;

  return (
    <div className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {Icon && <Icon size={32} className="text-emerald-600" />}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
        </div>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition"
        >
          {ActionIcon && <ActionIcon size={18} />}
          {action.label}
        </button>
      )}
    </div>
  );
}
