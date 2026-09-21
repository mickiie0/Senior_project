import React from 'react';
import { RefreshCw, Clock } from 'lucide-react';
import styles from './DashboardStyles';
import { formatClock } from './DashboardHelpers';

const DashboardHeader = ({ lastUpdated, isRefreshing, onRefresh, sseStatus = 'connected' }) => {
  const isSseConnected = sseStatus === 'connected';
  const isSseConnecting = sseStatus === 'connecting';

  const dotColor = isSseConnected ? '#10b981' : isSseConnecting ? '#f59e0b' : '#94a3b8';
  const pillBg = isSseConnected ? '#ecfdf5' : isSseConnecting ? '#fffbeb' : '#f1f5f9';
  const pillBorder = isSseConnected ? '#a7f3d0' : isSseConnecting ? '#fde68a' : '#cbd5e1';
  const statusLabel = isSseConnected
    ? 'SSE Live Stream (Real-time)'
    : isSseConnecting
    ? 'กำลังเชื่อมต่อ SSE...'
    : 'ระบบเฝ้าระวัง (Polling Fallback)';

  return (
    <div style={styles.headerBar}>
      <div>
        <div style={styles.headerTitleRow}>
          <h1 style={styles.headerTitle}>แดชบอร์ดภาพรวมระบบ</h1>
          <div
            style={{
              ...styles.livePill,
              backgroundColor: pillBg,
              borderColor: pillBorder,
            }}
            title={isSseConnected ? 'ระบบเชื่อมต่อ Server-Sent Events แบบเรียลไทม์' : 'กำลังเชื่อมต่อหรือใช้ระบบสำรอง'}
          >
            <span
              style={{
                ...styles.liveDot,
                backgroundColor: dotColor,
              }}
              className={isSseConnected ? 'live-dot-pulse' : ''}
            />
            <span style={{ ...styles.liveText, color: isSseConnected ? '#065f46' : isSseConnecting ? '#92400e' : '#475569' }}>
              {statusLabel}
            </span>
          </div>
        </div>
        <p style={styles.headerSubtitle}>
          ระบบตรวจจับไฟและควันจากกล้องวงจรปิดแบบเรียลไทม์
        </p>
      </div>

      <div style={styles.headerActions}>
        <div style={styles.lastUpdateText}>
          <Clock size={14} color="#64748b" />
          <span>อัปเดตล่าสุด: {formatClock(lastUpdated)}</span>
        </div>
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          style={{
            ...styles.refreshBtn,
            opacity: isRefreshing ? 0.7 : 1,
          }}
          title="กดเพื่อรีเฟรชข้อมูลล่าสุด"
        >
          <RefreshCw size={15} className={isRefreshing ? 'spin-icon' : ''} />
          <span>รีเฟรช</span>
        </button>
      </div>
    </div>
  );
};

export default DashboardHeader;
