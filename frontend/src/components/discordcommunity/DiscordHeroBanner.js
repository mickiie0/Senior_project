import React from 'react';
import { Radio, MessageSquare, ExternalLink, Copy, Check } from 'lucide-react';
import styles from './DiscordCommunityStyles';

const DiscordHeroBanner = ({ inviteUrl, copied, onCopyLink }) => {
  return (
    <div style={styles.heroCard}>
      <div style={styles.heroBackgroundEffect} />

      <div style={styles.heroContent}>
        <div style={styles.badgeRow}>
          <span style={styles.heroBadge}>
            <Radio size={13} className="sidebar-pulse-dot" color="#22c55e" />
            <span>DISCORD NOTIFICATIONS</span>
          </span>
        </div>

        <h1 style={styles.heroTitle}>
          เชื่อมต่อการแจ้งเตือนฉุกเฉินผ่าน <span style={styles.discordGradientText}>Discord</span>
        </h1>

        <p style={styles.heroSubtitle}>
          รับการแจ้งเตือนทันทีเมื่อระบบตรวจพบไฟหรือควันจากกล้องวงจรปิด CCTV 
          พร้อมดูภาพ Snapshot จากสถานที่เกิดเหตุผ่านแอปพลิเคชัน Discord บนสมาร์ทโฟนและคอมพิวเตอร์ของคุณตลอด 24 ชั่วโมง
        </p>

        <div style={styles.heroActions}>
          <a href={inviteUrl} target="_blank" rel="noopener noreferrer" style={styles.primaryJoinBtn}>
            <MessageSquare size={18} />
            <span>เข้าร่วม Discord Server</span>
            <ExternalLink size={16} />
          </a>

          <button onClick={onCopyLink} style={styles.secondaryCopyBtn}>
            {copied ? <Check size={17} color="#22c55e" /> : <Copy size={17} />}
            <span>{copied ? 'คัดลอกลิงก์สำเร็จแล้ว!' : 'คัดลอกลิงก์คำเชิญ'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiscordHeroBanner;
