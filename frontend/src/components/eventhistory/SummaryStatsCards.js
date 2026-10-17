import React from 'react';
import { Layers, Flame, AlertTriangle, Clock } from 'lucide-react';
import styles from './EventHistoryStyles';

const SummaryStatsCards = ({
  totalCount,
  fireCount,
  smokeCount,
  todayCount,
  selectedFilter = 'all',
  onSelectFilter,
}) => {
  const summaryCards = [
    {
      key: 'all',
      title: 'เหตุการณ์ทั้งหมด',
      count: totalCount,
      sub: 'บันทึกในฐานข้อมูลทั้งหมด',
      icon: Layers,
      color: '#2563eb',
      bgColor: '#eff6ff',
    },
    {
      key: 'fire',
      title: 'ไฟ (Fire)',
      count: fireCount,
      sub: 'เหตุการณ์ที่มีไฟไหม้',
      icon: Flame,
      color: '#dc2626',
      bgColor: '#fee2e2',
    },
    {
      key: 'smoke',
      title: 'ควัน (Smoke)',
      count: smokeCount,
      sub: 'เหตุการณ์ที่มีกลุ่มควัน',
      icon: AlertTriangle,
      color: '#d97706',
      bgColor: '#fef3c7',
    },
    {
      key: 'today',
      title: 'เกิดขึ้นวันนี้',
      count: todayCount,
      sub: 'เหตุการณ์ประจำวันปัจจุบัน',
      icon: Clock,
      color: '#16a34a',
      bgColor: '#f0fdf4',
    },
  ];

  return (
    <div style={styles.statsGrid}>
      {summaryCards.map(({ key, title, count, sub, icon: Icon, color, bgColor }) => {
        const isSelected = selectedFilter === key;

        return (
          <div
            key={key}
            onClick={() => {
              if (onSelectFilter) {
                onSelectFilter(key === selectedFilter && key !== 'all' ? 'all' : key);
              }
            }}
            style={{
              ...styles.statCard,
              cursor: onSelectFilter ? 'pointer' : 'default',
              border: isSelected ? `2px solid ${color}` : '1px solid #e2e8f0',
              backgroundColor: isSelected ? bgColor : '#ffffff',
              transform: isSelected ? 'translateY(-2px)' : 'none',
              boxShadow: isSelected ? `0 4px 12px ${color}25` : undefined,
              transition: 'all 0.2s ease',
            }}
            className="dash-card"
            title={`คลิกเพื่อกรอง: ${title}`}
          >
            <div style={styles.statHeader}>
              <span
                style={{
                  ...styles.statLabel,
                  color: isSelected ? color : '#64748b',
                  fontWeight: isSelected ? '700' : '600',
                }}
              >
                {title}
              </span>
              <div
                style={{
                  ...styles.statIconBadge,
                  backgroundColor: isSelected ? '#ffffff' : bgColor,
                  color,
                }}
              >
                <Icon size={18} />
              </div>
            </div>
            <div
              style={{
                ...styles.statNumber,
                color: key === 'all' ? (isSelected ? color : '#0f172a') : color,
              }}
            >
              {count}
            </div>
            <div style={styles.statSub}>{sub}</div>
          </div>
        );
      })}
    </div>
  );
};

export default SummaryStatsCards;
