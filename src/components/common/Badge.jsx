import React from 'react';
import { ArrowUp, ArrowRight, ArrowDown } from 'lucide-react';

export const StatusBadge = ({ status }) => {
  const norm = (status || 'current').toLowerCase();
  
  const statusConfig = {
    current: { label: 'Current', color: 'var(--status-current-solid)', className: 'badge-status-current' },
    later: { label: 'Later', color: 'var(--status-later-solid)', className: 'badge-status-later' },
    done: { label: 'Done', color: 'var(--status-done-solid)', className: 'badge-status-done' },
  };

  const config = statusConfig[norm] || statusConfig.current;

  return (
    <span className={`badge ${config.className}`}>
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          backgroundColor: config.color,
          display: 'inline-block',
        }}
      />
      <span>{config.label}</span>
    </span>
  );
};

export const PriorityBadge = ({ priority }) => {
  const norm = (priority || 'medium').toLowerCase();

  const priorityConfig = {
    urgent: { label: 'Urgent', icon: ArrowUp, className: 'badge-priority-urgent' },
    high: { label: 'High', icon: ArrowUp, className: 'badge-priority-high' },
    medium: { label: 'Medium', icon: ArrowRight, className: 'badge-priority-medium' },
    low: { label: 'Low', icon: ArrowDown, className: 'badge-priority-low' },
  };

  const config = priorityConfig[norm] || priorityConfig.medium;
  const Icon = config.icon;

  return (
    <span className={`badge ${config.className}`}>
      <Icon size={10} />
      <span>{config.label}</span>
    </span>
  );
};

export const TagBadge = ({ tag, onRemove, onClick }) => {
  const cleanTag = tag.toLowerCase().trim();
  const knownTags = ['feature', 'bug', 'documentation', 'doc', 'refactor', 'testing', 'ui', 'ux', 'ui-ux', 'devops', 'api'];
  const tagClass = knownTags.includes(cleanTag) ? `tag-${cleanTag}` : 'tag-default';

  return (
    <span
      className={`tag-badge ${tagClass} ${onClick ? 'cursor-pointer hover:opacity-80' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      #{cleanTag}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(tag);
          }}
          style={{ marginLeft: 3, background: 'none', border: 'none', cursor: 'pointer', padding: 0, opacity: 0.6 }}
          title="Remove tag"
        >
          ×
        </button>
      )}
    </span>
  );
};
