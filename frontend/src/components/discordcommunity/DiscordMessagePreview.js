import React from 'react';
import { Flame } from 'lucide-react';
import styles from './DiscordCommunityStyles';

const DiscordMessagePreview = () => {
  return (
    <div style={styles.previewSection}>
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>ตัวอย่างการแจ้งเตือนบน Discord</h2>
        <p style={styles.sectionSubtitle}>
          รูปแบบการส่งข้อมูลเหตุการณ์อัตโนมัติจากระบบเข้าสู่ห้องแชท Discord
        </p>
      </div>

      <div style={styles.discordMockupCard}>
        <div style={styles.mockupHeader}>
          <div style={styles.mockupChannelName}>
            <span style={{ fontSize: '18px', color: '#80848e' }}>#</span>
            <span style={{ fontWeight: '700', color: '#f2f3f5' }}>🚨fire-alerts</span>
          </div>
        </div>

        <div style={styles.mockupBody}>
          <div style={styles.mockupAvatar}>
            <Flame size={24} color="#ffffff" />
          </div>

          <div style={styles.mockupMessageContent}>
            <div style={styles.mockupAuthorRow}>
              <span style={styles.mockupAuthorName}>Fire & Smoke Detection Alert</span>
              <span style={styles.mockupBotTag}>App</span>
              <span style={styles.mockupTimestamp}>วันนี้ เวลา 14:32 น.</span>
            </div>

            <div style={styles.mockupEmbed}>
              <div style={styles.embedBorderHighlight} />
              <div style={styles.embedInner}>
                <div style={styles.embedTitle}>🚨 ตรวจพบสัญญาณเพลิงไหม้ฉุกเฉิน!</div>
                <div style={styles.embedDescription}>
                  ระบบตรวจจับไฟและควันจากกล้องวงจรปิด CCTV
                  <br />
                  กรุณาตรวจสอบสถานการณ์ทันที!
                </div>

                <div style={styles.embedFieldsGrid}>
                  <div style={styles.embedField}>
                    <div style={styles.embedFieldKey}>รหัสเหตุการณ์</div>
                    <div style={styles.embedFieldValueMono}>EVT-00000X</div>
                  </div>
                  <div style={styles.embedField}>
                    <div style={styles.embedFieldKey}>กล้องที่ตรวจพบ</div>
                    <div style={styles.embedFieldValue}>CAM-001 | Building A - Floor 2</div>
                  </div>
                  <div style={styles.embedField}>
                    <div style={styles.embedFieldKey}>🔥 ประเภทการตรวจจับ</div>
                    <div style={{ ...styles.embedFieldValue, fontWeight: '700' }}>
                      ไฟ (FIRE)
                    </div>
                  </div>
                  <div style={styles.embedField}>
                    <div style={styles.embedFieldKey}>ความมั่นใจ</div>
                    <div style={{ ...styles.embedFieldValue, fontWeight: '700' }}>
                      94.8%
                    </div>
                  </div>
                  <div style={{ ...styles.embedField, gridColumn: 'span 2' }}>
                    <div style={styles.embedFieldKey}>วันและเวลาที่ตรวจพบ</div>
                    <div style={styles.embedFieldValue}>28 ก.ย. 2569 เวลา 14:32:05 น.</div>
                  </div>
                  <div style={{ ...styles.embedField, gridColumn: 'span 2' }}>
                    <div style={styles.embedFieldKey}>ระบบตรวจจับไฟและควัน</div>
                    <div style={styles.embedFieldValueLink}>
                      🔗 <span>คลิกที่นี่เพื่อเปิดดูเหตุการณ์บนเว็บไซต์</span>
                    </div>
                  </div>
                </div>

                <div style={styles.embedFooter}>
                  Fire & Smoke Detection System from CCTV • Automated Emergency Alert
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscordMessagePreview;
