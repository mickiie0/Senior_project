import React from 'react';

const STATUS_BADGE_CONFIG = {
  active: {
    bg: '#dcfce7',
    color: '#15803d',
    border: '#bbf7d0',
    dotColor: '#16a34a',
    label: 'Active',
  },
  inactive: {
    bg: '#fee2e2',
    color: '#b91c1c',
    border: '#fecaca',
    dotColor: '#dc2626',
    label: 'Inactive',
  },
};

const StatusBadge = ({ status }) => {
  const current = STATUS_BADGE_CONFIG[status] || STATUS_BADGE_CONFIG.inactive;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: current.bg,
        color: current.color,
        border: `1px solid ${current.border}`,
        padding: '3px 10px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: '600',
        letterSpacing: '0.2px',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: current.dotColor,
        }}
      />
      {current.label}
    </span>
  );
};

export default StatusBadge;