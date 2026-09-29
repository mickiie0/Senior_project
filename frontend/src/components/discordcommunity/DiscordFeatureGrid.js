import React from 'react';
import { Zap, Camera, Smartphone, ShieldAlert } from 'lucide-react';
import styles from './DiscordCommunityStyles';

const FEATURES = [
  {
    icon: Zap,
    bgColor: '#eff6ff',
    color: '#2563eb',
    title: 'แจ้งเตือน Real-Time ทันใจ',
    desc: 'ระบบประมวลผล AI ส่งข้อมูลแจ้งเตือนผ่าน Discord Webhook ทันทีในเสี้ยววินาทีเมื่อเกิดเหตุเพลิงไหม้',
  },
  {
    icon: Camera,
    bgColor: '#fef2f2',
    color: '#dc2626',
    title: 'ภาพ Snapshot จุดเกิดเหตุ',
    desc: 'แนบภาพถ่ายขณะเกิดเหตุพร้อมตำแหน่งพิกัด Bounding Box ให้เจ้าหน้าที่วิเคราะห์เหตุการณ์ได้อย่างแม่นยำ',
  },
  {
    icon: Smartphone,
    bgColor: '#f5f3ff',
    color: '#7c3aed',
    title: 'รองรับทุกอุปกรณ์ 24 ชม.',
    desc: 'เปิดรับการแจ้งเตือนได้ทั้งบนสมาร์ทโฟน iOS, Android, คอมพิวเตอร์ Mac หรือ Windows ไม่พลาดทุกสถานการณ์',
  },
  {
    icon: ShieldAlert,
    bgColor: '#ecfdf5',
    color: '#059669',
    title: 'ประสานงานระงับเหตุฉุกเฉิน',
    desc: 'เป็นศูนย์กลางให้เจ้าหน้าที่รักษาความปลอดภัยและฝ่ายอาคารสื่อสารและเข้าระงับเหตุได้อย่างรวดเร็ว',
  },
];

const DiscordFeatureGrid = () => {
  return (
    <div style={styles.featuresGrid}>
      {FEATURES.map(({ icon: Icon, bgColor, color, title, desc }) => (
        <div key={title} style={styles.featureCard}>
          <div style={{ ...styles.featureIconWrap, backgroundColor: bgColor, color }}>
            <Icon size={22} />
          </div>
          <h3 style={styles.featureTitle}>{title}</h3>
          <p style={styles.featureDesc}>{desc}</p>
        </div>
      ))}
    </div>
  );
};

export default DiscordFeatureGrid;
