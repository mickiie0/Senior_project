import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import styles from './DiscordCommunityStyles';

const STEPS = [
  {
    number: 1,
    title: 'เปิดแอปพลิเคชัน Discord',
    desc: 'เข้าสู่ระบบด้วยบัญชี Discord ของคุณ (สามารถใช้งานผ่านมือถือหรือเว็บเบราว์เซอร์ได้)',
  },
  {
    number: 2,
    title: 'กดปุ่มเข้าร่วมผ่านลิงก์เชิญ',
    desc: 'กดปุ่ม "เข้าร่วม Discord Server" ด้านบน เพื่อตอบรับคำเชิญเข้าสู่เซิร์ฟเวอร์',
  },
  {
    number: 3,
    title: 'เปิดการแจ้งเตือนช่อง #fire-alerts',
    desc: 'ตั้งค่า Notification เป็น "All Messages" ในห้องแจ้งเตือนเพื่อรับเสียงเตือนทันทีเมื่อเกิดเหตุ',
  },
];

const JoinStepsGuide = () => {
  return (
    <div style={styles.infoCard}>
      <div style={styles.infoCardHeader}>
        <CheckCircle2 size={20} color="#2563eb" />
        <h3 style={styles.infoCardTitle}>ขั้นตอนการเข้าร่วมใน 3 ขั้นตอน</h3>
      </div>
      <div style={styles.stepList}>
        {STEPS.map(({ number, title, desc }) => (
          <div key={number} style={styles.stepItem}>
            <div style={styles.stepNumber}>{number}</div>
            <div>
              <div style={styles.stepTitle}>{title}</div>
              <div style={styles.stepDesc}>{desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JoinStepsGuide;
