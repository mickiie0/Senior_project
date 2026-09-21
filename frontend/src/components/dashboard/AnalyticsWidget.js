import React from 'react';
import { Activity } from 'lucide-react';
import styles from './DashboardStyles';

const AnalyticsWidget = ({
  totalFireDetections,
  totalSmokeDetections,
  recentDetectionsCount,
  avgConfidence,
  isAdmin,
}) => {
  const total = totalFireDetections + totalSmokeDetections;
  const firePct = total > 0 ? Math.round((totalFireDetections / total) * 100) : 0;
  const smokePct = total > 0 ? Math.round((totalSmokeDetections / total) * 100) : 0;

  return (
    <div style={styles.sideCard} className="dash-card">
      <div style={styles.sideCardHeader}>
        <div style={styles.cardTitleWithIcon}>
          <Activity size={17} color="#2563eb" />
          <h3 style={styles.sideCardTitle}>สัดส่วนการตรวจจับ (Analytics)</h3>
        </div>
      </div>

      <div style={styles.analyticsBody}>
        <div style={styles.ratioHeader}>
          <span style={styles.subLabel}>จำนวนวัตถุที่ตรวจพบสะสม</span>
          <span style={styles.subValue}>
            รวม {total} ครั้ง ({recentDetectionsCount} เหตุการณ์)
          </span>
        </div>

        {total > 0 ? (
          <div style={styles.stackedBar}>
            <div
              style={{ ...styles.barSegmentFire, width: `${firePct}%` }}
              title={`ไฟ: ${totalFireDetections} ครั้ง`}
            />
            <div
              style={{ ...styles.barSegmentSmoke, width: `${smokePct}%` }}
              title={`ควัน: ${totalSmokeDetections} ครั้ง`}
            />
          </div>
        ) : (
          <div style={styles.stackedBarEmpty} />
        )}

        <div style={styles.legendGrid}>
          <div style={styles.legendItem}>
            <div style={styles.legendIndicatorFire} />
            <div>
              <div style={styles.legendLabel}>เปลวไฟ (Fire)</div>
              <div style={styles.legendNum}>
                {totalFireDetections} <span style={styles.legendPct}>({firePct}%)</span>
              </div>
            </div>
          </div>

          <div style={styles.legendItem}>
            <div style={styles.legendIndicatorSmoke} />
            <div>
              <div style={styles.legendLabel}>กลุ่มควัน (Smoke)</div>
              <div style={styles.legendNum}>
                {totalSmokeDetections} <span style={styles.legendPct}>({smokePct}%)</span>
              </div>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div style={styles.confidenceMetricBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#475569', fontWeight: '500' }}>
                ความแม่นยำเฉลี่ย (Avg Confidence)
              </span>
              <span style={{ fontSize: '15px', color: '#0f172a', fontWeight: '700' }}>
                {avgConfidence > 0 ? `${avgConfidence.toFixed(1)}%` : '-'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsWidget;