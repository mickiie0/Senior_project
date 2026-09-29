import React from 'react';
import { Bell } from 'lucide-react';
import styles from './DiscordCommunityStyles';

const CHANNELS = [
  {
    key: 'alerts',
    label: '# 🚨fire-alerts',
    badgeStyleKey: 'channelBadgeRed',
    desc: 'ห้องแจ้งเตือนหลัก — ใช้สำหรับทั้งการตรวจพบไฟ 🔥 และควัน 💨 จากระบบ AI พร้อมภาพ Snapshot แบบอัตโนมัติ',
  },
  {
    key: 'announcements',
    label: '# 📢-announcements',
    badgeStyleKey: 'channelBadgeBlue',
    desc: 'ประกาศ ข้อมูลการอัปเดตระบบ และการทดสอบระบบตรวจจับ',
  },
  {
    key: 'general',
    label: '# 💬-general',
    badgeStyleKey: 'channelBadgeSlate',
    desc: 'พื้นที่พูดคุย สื่อสาร และแจ้งปัญหาการใช้งานระบบร่วมกับผู้ดูแล',
  },
];

const ChannelDirectory = () => {
  return (
    <div style={styles.infoCard}>
      <div style={styles.infoCardHeader}>
        <Bell size={20} color="#d97706" />
        <h3 style={styles.infoCardTitle}>โครงสร้างห้องแจ้งเตือนใน Discord</h3>
      </div>
      <div style={styles.channelList}>
        {CHANNELS.map(({ key, label, badgeStyleKey, desc }) => (
          <div key={key} style={styles.channelItem}>
            <div style={styles[badgeStyleKey]}>{label}</div>
            <div style={styles.channelDesc}>{desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChannelDirectory;
