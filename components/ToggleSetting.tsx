import React from 'react';

interface ToggleSettingProps {
  icon: React.ReactNode;
  iconBgClass: string;
  iconColorClass: string;
  title: string;
  description?: string;
  value: boolean;
  onChange: () => void;
}

export const ToggleSetting: React.FC<ToggleSettingProps> = ({
  icon,
  iconBgClass,
  iconColorClass,
  title,
  description,
  value,
  onChange,
}) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-100">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${iconBgClass} ${iconColorClass}`}>{icon}</div>
      <div>
        <h4 className="font-bold text-gray-700">{title}</h4>
        {description && <p className="text-xs text-gray-400">{description}</p>}
      </div>
    </div>
    <button
      onClick={onChange}
      aria-pressed={value}
      className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${
        value ? 'bg-candy-mint' : 'bg-gray-300'
      }`}
    >
      <div
        className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${
          value ? 'translate-x-6' : 'translate-x-0'
        }`}
      />
    </button>
  </div>
);
