import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import {
  Flame,
  ShieldAlert,
  ShieldCheck,
  Camera,
  RefreshCw,
  Clock,
  MapPin,
  AlertTriangle,
  Eye,
  Video,
  CheckCircle2,
  Activity,
  ArrowUpRight,
  X,
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:8080/api';
const BACKEND_BASE_URL = 'http://localhost:8080';
const POLL_INTERVAL_MS = 5000;
const ACTIVE_CAMERA_STATUS = 'active';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

const isCameraOnline = (cam) => cam.is_active === true || cam.status === ACTIVE_CAMERA_STATUS;

const isAuthError = (result) =>
  result.status === 'rejected' && result.reason?.response?.status === 401;

const getFullImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${BACKEND_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

const formatTimeAgo = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'เมื่อสักครู่';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
  return date.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatClock = (date) => {
  if (!date) return '-';
  return date.toLocaleTimeString('th-TH', { hour12: false });
};

// Helper to parse all detection types and confidence scores from an event
const parseEventDetections = (event) => {
  if (!event) {
    return {
      details: [],
      hasFire: false,
      hasSmoke: false,
      hasBoth: false,
      types: [],
      highestConf: 0,
      totalCount: 0,
    };
  }

  let details = [];
  if (Array.isArray(event.details) && event.details.length > 0) {
    details = event.details;
  } else if (event.detection_type) {
    details = [
      {
        detection_type: event.detection_type,
        confidence: typeof event.confidence === 'number' ? event.confidence : 0,
      },
    ];
  }

  let hasFire = false;
  let hasSmoke = false;
  let maxFireConfidence = 0;
  let maxSmokeConfidence = 0;
  let highestConf = 0;
  const typesMap = {};

  details.forEach((d) => {
    const rawType = (d.detection_type || '').toLowerCase().trim();
    const conf = typeof d.confidence === 'number' ? d.confidence : 0;
    if (conf > highestConf) highestConf = conf;

    if (rawType.includes('fire')) {
      hasFire = true;
      if (conf > maxFireConfidence) maxFireConfidence = conf;
      if (!typesMap['fire']) {
        typesMap['fire'] = { type: 'fire', label: 'FIRE', maxConfidence: conf, count: 0 };
      }
      typesMap['fire'].count += 1;
      typesMap['fire'].maxConfidence = Math.max(typesMap['fire'].maxConfidence, conf);
    } else if (rawType.includes('smoke')) {
      hasSmoke = true;
      if (conf > maxSmokeConfidence) maxSmokeConfidence = conf;
      if (!typesMap['smoke']) {
        typesMap['smoke'] = { type: 'smoke', label: 'SMOKE', maxConfidence: conf, count: 0 };
      }
      typesMap['smoke'].count += 1;
      typesMap['smoke'].maxConfidence = Math.max(typesMap['smoke'].maxConfidence, conf);
    } else if (rawType) {
      if (!typesMap[rawType]) {
        typesMap[rawType] = { type: rawType, label: rawType.toUpperCase(), maxConfidence: conf, count: 0 };
      }
      typesMap[rawType].count += 1;
      typesMap[rawType].maxConfidence = Math.max(typesMap[rawType].maxConfidence, conf);
    }
  });

  const types = Object.values(typesMap);
  if (types.length === 0) {
    types.push({ type: 'unknown', label: 'UNKNOWN', maxConfidence: 0, count: 0 });
  }

  return {
    details,
    hasFire,
    hasSmoke,
    hasBoth: hasFire && hasSmoke,
    maxFireConfidence,
    maxSmokeConfidence,
    highestConf,
    types,
    totalCount: details.length,
  };
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [recentDetections, setRecentDetections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'fire' | 'smoke'
  const [selectedEvent, setSelectedEvent] = useState(null);

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleSessionExpired = useCallback(() => {
    localStorage.removeItem('token');
    navigate('/');
  }, [navigate]);

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }

      try {
        const response = await axios.get(`${API_BASE_URL}/me`, getAuthHeaders());
        if (isMountedRef.current) setUser(response.data);
      } catch (err) {
        handleSessionExpired();
      }
    };

    fetchUserData();
  }, [navigate, handleSessionExpired]);

  const fetchDashboardData = useCallback(async (isManual = false) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    if (isManual) setIsRefreshing(true);

    try {
      const [camRes, detectRes] = await Promise.allSettled([
        axios.get(`${API_BASE_URL}/cameras`, getAuthHeaders()),
        axios.get(`${API_BASE_URL}/detections`, getAuthHeaders()),
      ]);

      if (isAuthError(camRes) || isAuthError(detectRes)) {
        handleSessionExpired();
        return;
      }

      if (!isMountedRef.current) return;

      if (camRes.status === 'fulfilled') {
        setCameras(camRes.value.data || []);
      }
      if (detectRes.status === 'fulfilled') {
        setRecentDetections(detectRes.value.data || []);
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        if (isManual) setIsRefreshing(false);
      }
    }
  }, [handleSessionExpired]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => fetchDashboardData(false), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Fast camera map by ID
  const camerasMap = useMemo(() => {
    const map = {};
    cameras.forEach((cam) => {
      if (cam.camera_id) map[cam.camera_id] = cam;
      if (cam.id) map[cam.id] = cam;
    });
    return map;
  }, [cameras]);

  // Statistics computations
  const totalCameras = cameras.length;
  const activeCameras = cameras.filter(isCameraOnline).length;
  const maintenanceCameras = cameras.filter((c) => c.status === 'maintenance').length;
  const inactiveCameras = totalCameras - activeCameras - maintenanceCameras;
  const cameraOnlinePercent = totalCameras > 0 ? Math.round((activeCameras / totalCameras) * 100) : 0;

  // Filter today's detections
  const todayDetections = useMemo(() => {
    const todayStr = new Date().toDateString();
    return recentDetections.filter((item) => {
      if (!item.created_at) return false;
      return new Date(item.created_at).toDateString() === todayStr;
    });
  }, [recentDetections]);

  // Multi-detection analytics across all events
  const { totalFireDetections, totalSmokeDetections, eventsWithFire, eventsWithSmoke, avgConfidence } = useMemo(() => {
    let fTotal = 0;
    let sTotal = 0;
    let evtWithF = 0;
    let evtWithS = 0;
    let confSum = 0;
    let confCount = 0;

    recentDetections.forEach((evt) => {
      const parsed = parseEventDetections(evt);
      if (parsed.hasFire) evtWithF++;
      if (parsed.hasSmoke) evtWithS++;

      parsed.details.forEach((d) => {
        const t = (d.detection_type || '').toLowerCase();
        if (t.includes('fire')) fTotal++;
        else if (t.includes('smoke')) sTotal++;

        if (typeof d.confidence === 'number' && d.confidence > 0) {
          confSum += d.confidence;
          confCount++;
        }
      });
    });

    return {
      totalFireDetections: fTotal,
      totalSmokeDetections: sTotal,
      eventsWithFire: evtWithF,
      eventsWithSmoke: evtWithS,
      avgConfidence: confCount > 0 ? (confSum / confCount) * 100 : 0,
    };
  }, [recentDetections]);

  // Today fire & smoke detection counts
  const { fireTodayCount, smokeTodayCount } = useMemo(() => {
    let fCount = 0;
    let sCount = 0;
    todayDetections.forEach((evt) => {
      const parsed = parseEventDetections(evt);
      if (parsed.hasFire) fCount++;
      if (parsed.hasSmoke) sCount++;
    });
    return { fireTodayCount: fCount, smokeTodayCount: sCount };
  }, [todayDetections]);

  // Filtered detections based on tab
  const filteredDetections = useMemo(() => {
    if (filterType === 'all') return recentDetections;
    return recentDetections.filter((item) => {
      const parsed = parseEventDetections(item);
      if (filterType === 'fire') return parsed.hasFire;
      if (filterType === 'smoke') return parsed.hasSmoke;
      return true;
    });
  }, [recentDetections, filterType]);

  // Latest high-risk event detection
  const hasActiveFireAlert = fireTodayCount > 0;
  const latestAlertEvent = hasActiveFireAlert
    ? todayDetections.find((d) => parseEventDetections(d).hasFire)
    : null;

  return (
    <MainLayout
      title="Fire Detection Dashboard"
      username={user?.username || 'User'}
      userRole={user?.role || 'user'}
    >
      <style>{`
        @keyframes pulse-live {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.15); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .live-dot-pulse {
          animation: pulse-live 2s infinite ease-in-out;
        }
        .spin-icon {
          animation: spin 0.8s linear infinite;
        }
        .interactive-row:hover {
          background-color: #f8fafc !important;
        }
        .dash-card:hover {
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.07), 0 4px 6px -2px rgba(0, 0, 0, 0.03);
          transition: all 0.2s ease-in-out;
        }
        .filter-btn {
          transition: all 0.15s ease;
        }
        .filter-btn:hover {
          opacity: 0.9;
        }
      `}</style>

      <div style={styles.page}>
        {/* Top Header & Live Status Bar */}
        <div style={styles.headerBar}>
          <div>
            <div style={styles.headerTitleRow}>
              <h1 style={styles.headerTitle}>แดชบอร์ดภาพรวมระบบ</h1>
              <div style={styles.livePill}>
                <span style={styles.liveDot} className="live-dot-pulse" />
                <span style={styles.liveText}>ระบบเฝ้าระวังแบบ Real-time</span>
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
              onClick={() => fetchDashboardData(true)}
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

        {/* Dynamic Emergency / Status Banner */}
        {hasActiveFireAlert ? (
          <div style={styles.dangerAlertBanner}>
            <div style={styles.alertBannerIconWrapperDanger}>
              <Flame size={24} color="#dc2626" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={styles.alertTitleDanger}>
                🚨 ตรวจพบสัญญาณเพลิงไหม้ในระบบ
              </div>
              <div style={styles.alertSubtitleDanger}>
                {latestAlertEvent ? (
                  <>
                    เหตุการณ์ล่าสุด: <strong>{latestAlertEvent.event_id}</strong> ที่กล้อง{' '}
                    <strong>{latestAlertEvent.camera_id}</strong> (
                    {camerasMap[latestAlertEvent.camera_id]?.location || 'ไม่ระบุตำแหน่ง'} -{' '}
                    {camerasMap[latestAlertEvent.camera_id]?.sub_location || '-'}) เวลา{' '}
                    {formatTimeAgo(latestAlertEvent.created_at)}
                  </>
                ) : (
                  'กรุณาตรวจสอบหน้างานและตำแหน่งกล้องที่แจ้งเตือนโดยทันที'
                )}
              </div>
            </div>
            {latestAlertEvent && (
              <button
                onClick={() => setSelectedEvent(latestAlertEvent)}
                style={styles.alertActionBtnDanger}
              >
                <Eye size={15} />
                <span>ดูภาพเหตุการณ์</span>
              </button>
            )}
          </div>
        ) : (
          <div style={styles.safeAlertBanner}>
            <div style={styles.alertBannerIconWrapperSafe}>
              <ShieldCheck size={22} color="#16a34a" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={styles.alertTitleSafe}>สถานะความปลอดภัยปกติ (Secure)</div>
              <div style={styles.alertSubtitleSafe}>
                ทุกพื้นที่อยู่ภายใต้การเฝ้าระวัง ไม่พบสัญญาณไฟหรือควันในขณะนี้
              </div>
            </div>
            <div style={styles.safeBadgePill}>
              <CheckCircle2 size={14} color="#16a34a" />
              <span>All Systems Nominal</span>
            </div>
          </div>
        )}

        {/* 4 Stat KPI Cards */}
        <div style={styles.statsGrid}>
          {/* Card 1: Total Cameras */}
          <div style={styles.statCard} className="dash-card">
            <div style={styles.statCardHeader}>
              <span style={styles.statCardTitle}>กล้องทั้งหมดในระบบ</span>
              <div style={{ ...styles.statIconBadge, backgroundColor: '#eff6ff', color: '#2563eb' }}>
                <Video size={18} />
              </div>
            </div>
            <div style={styles.statCardValue}>{totalCameras}</div>
            <div style={styles.statCardFooter}>
              <span style={{ color: '#16a34a', fontWeight: '600' }}>{activeCameras} ปกติ</span>
              <span style={{ color: '#cbd5e1' }}>•</span>
              <span style={{ color: '#d97706', fontWeight: '500' }}>{maintenanceCameras} ซ่อม</span>
              <span style={{ color: '#cbd5e1' }}>•</span>
              <span style={{ color: '#dc2626', fontWeight: '500' }}>{inactiveCameras} ปิด</span>
            </div>
          </div>

          {/* Card 2: Camera Availability */}
          <div style={styles.statCard} className="dash-card">
            <div style={styles.statCardHeader}>
              <span style={styles.statCardTitle}>อัตรากล้องพร้อมใช้งาน</span>
              <div style={{ ...styles.statIconBadge, backgroundColor: '#ecfdf5', color: '#059669' }}>
                <Activity size={18} />
              </div>
            </div>
            <div style={{ ...styles.statCardValue, color: '#059669' }}>
              {cameraOnlinePercent}%
            </div>
            <div style={styles.progressContainer}>
              <div
                style={{
                  ...styles.progressBar,
                  width: `${cameraOnlinePercent}%`,
                  backgroundColor: cameraOnlinePercent > 75 ? '#10b981' : cameraOnlinePercent > 50 ? '#f59e0b' : '#ef4444',
                }}
              />
            </div>
            <div style={styles.statCardSubText}>
              พร้อมใช้งาน {activeCameras} จาก {totalCameras} ตัว
            </div>
          </div>

          {/* Card 3: Detections Today */}
          <div style={styles.statCard} className="dash-card">
            <div style={styles.statCardHeader}>
              <span style={styles.statCardTitle}>ตรวจพบวันนี้</span>
              <div
                style={{
                  ...styles.statIconBadge,
                  backgroundColor: todayDetections.length > 0 ? '#fee2e2' : '#f8fafc',
                  color: todayDetections.length > 0 ? '#dc2626' : '#64748b',
                }}
              >
                <Flame size={18} />
              </div>
            </div>
            <div
              style={{
                ...styles.statCardValue,
                color: todayDetections.length > 0 ? '#dc2626' : '#0f172a',
              }}
            >
              {todayDetections.length}
            </div>
            <div style={styles.detectionPillsRow}>
              <span style={styles.miniFirePill}>🔥 ไฟ {fireTodayCount}</span>
              <span style={styles.miniSmokePill}>💨 ควัน {smokeTodayCount}</span>
            </div>
          </div>

          {/* Card 4: Security Status */}
          <div style={styles.statCard} className="dash-card">
            <div style={styles.statCardHeader}>
              <span style={styles.statCardTitle}>ระดับการแจ้งเตือน</span>
              <div
                style={{
                  ...styles.statIconBadge,
                  backgroundColor: hasActiveFireAlert ? '#fef2f2' : '#f0fdf4',
                  color: hasActiveFireAlert ? '#dc2626' : '#16a34a',
                }}
              >
                {hasActiveFireAlert ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
              </div>
            </div>
            <div
              style={{
                ...styles.statCardValue,
                fontSize: '22px',
                color: hasActiveFireAlert ? '#dc2626' : '#16a34a',
                marginTop: '10px',
              }}
            >
              {hasActiveFireAlert ? 'เฝ้าระวังฉุกเฉิน' : 'ระดับปกติ'}
            </div>
            <div style={styles.statCardSubText}>
              {hasActiveFireAlert ? 'ตรวจพบเหตุการณ์ใน 24 ชม.' : 'ไม่พบเหตุการณ์ผิดปกติ'}
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div style={styles.splitGrid}>
          {/* Left Column: Recent Detections Feed */}
          <div style={styles.mainCard} className="dash-card">
            {/* Card Header & Filter Tabs */}
            <div style={styles.cardHeaderArea}>
              <div style={styles.cardHeaderLeft}>
                <div style={styles.cardTitleWithIcon}>
                  <Flame size={18} color="#dc2626" />
                  <h3 style={styles.cardTitle}>เหตุการณ์ตรวจจับล่าสุด (Recent Detections)</h3>
                </div>
                <span style={styles.badgeLivePulse}>
                  <span style={styles.liveDotSmall} className="live-dot-pulse" />
                  Live Feed
                </span>
              </div>

              {/* Filter Tabs */}
              <div style={styles.filterGroup}>
                <button
                  className="filter-btn"
                  onClick={() => setFilterType('all')}
                  style={{
                    ...styles.filterTab,
                    ...(filterType === 'all' ? styles.filterTabActive : {}),
                  }}
                >
                  ทั้งหมด ({recentDetections.length})
                </button>
                <button
                  className="filter-btn"
                  onClick={() => setFilterType('fire')}
                  style={{
                    ...styles.filterTab,
                    ...(filterType === 'fire' ? styles.filterTabActiveFire : {}),
                  }}
                >
                  ไฟ ({eventsWithFire})
                </button>
                <button
                  className="filter-btn"
                  onClick={() => setFilterType('smoke')}
                  style={{
                    ...styles.filterTab,
                    ...(filterType === 'smoke' ? styles.filterTabActiveSmoke : {}),
                  }}
                >
                  ควัน ({eventsWithSmoke})
                </button>
              </div>
            </div>

            {/* Content Table */}
            {loading ? (
              <div style={styles.loadingArea}>
                <RefreshCw size={24} className="spin-icon" color="#2563eb" />
                <p style={{ marginTop: '12px', color: '#64748b', fontSize: '14px' }}>
                  กำลังเชื่อมต่อและโหลดข้อมูลเหตุการณ์...
                </p>
              </div>
            ) : filteredDetections.length === 0 ? (
              <div style={styles.emptyArea}>
                <div style={styles.emptyIconCircle}>
                  <CheckCircle2 size={32} color="#16a34a" />
                </div>
                <h4 style={styles.emptyTitle}>ไม่พบรายการตรวจจับ</h4>
                <p style={styles.emptyDesc}>
                  {filterType === 'all'
                    ? 'ระบบไม่พบเหตุการณ์เพลิงไหม้หรือควันในขณะนี้ ข้อมูลจะอัปเดตอัตโนมัติเมื่อ AI ตรวจพบ'
                    : `ไม่พบรายการประเภท "${filterType.toUpperCase()}" ในประวัติล่าสุด`}
                </p>
              </div>
            ) : (
              <div style={styles.tableScroll}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeadRow}>
                      <th style={styles.th}>Event ID</th>
                      <th style={styles.th}>ประเภทที่ตรวจพบ</th>
                      <th style={styles.th}>ความมั่นใจ (AI)</th>
                      <th style={styles.th}>กล้อง & ตำแหน่ง</th>
                      <th style={styles.th}>เวลาที่บันทึก</th>
                      <th style={{ ...styles.th, textAlign: 'center' }}>การกระทำ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDetections.slice(0, 6).map((item, index) => {
                      const parsed = parseEventDetections(item);
                      const camInfo = camerasMap[item.camera_id];

                      return (
                        <tr
                          key={item.event_id || index}
                          style={styles.tableRow}
                          className="interactive-row"
                        >
                          {/* Column 1: Event ID & Sub-info */}
                          <td style={styles.td}>
                            <div style={styles.eventIdText}>{item.event_id || `EVT-#${index + 1}`}</div>
                            <div style={styles.subTextMuted}>{formatTimeAgo(item.created_at)}</div>
                          </td>

                          {/* Column 2: Types Detected */}
                          <td style={styles.td}>
                            <div style={styles.typeBadgesContainer}>
                              {parsed.types.map((t) => {
                                const isF = t.type === 'fire';
                                const isS = t.type === 'smoke';
                                return (
                                  <span
                                    key={t.type}
                                    style={{
                                      ...styles.typeBadge,
                                      backgroundColor: isF ? '#fee2e2' : isS ? '#fef3c7' : '#f1f5f9',
                                      color: isF ? '#b91c1c' : isS ? '#b45309' : '#475569',
                                      border: `1px solid ${isF ? '#fecaca' : isS ? '#fde68a' : '#e2e8f0'}`,
                                    }}
                                  >
                                    {isF ? <Flame size={12} /> : isS ? <AlertTriangle size={12} /> : null}
                                    <span>
                                      {t.label}
                                      {t.count > 1 ? ` (${t.count})` : ''}
                                    </span>
                                  </span>
                                );
                              })}
                            </div>
                          </td>

                          {/* Column 3: Confidence Score */}
                          <td style={styles.td}>
                            <div style={styles.confColumnList}>
                              {parsed.types.map((t) => {
                                const confPct = (t.maxConfidence * 100).toFixed(1);
                                const isF = t.type === 'fire';
                                return (
                                  <div key={t.type} style={styles.confCell}>
                                    <div style={styles.confRowHeader}>
                                      <span style={styles.confLabelType}>{t.label}</span>
                                      <span style={styles.confValueText}>{confPct}%</span>
                                    </div>
                                    <div style={styles.confBarBg}>
                                      <div
                                        style={{
                                          ...styles.confBarFill,
                                          width: `${Math.min(100, Math.max(0, confPct))}%`,
                                          backgroundColor: isF ? '#ef4444' : '#f59e0b',
                                        }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </td>

                          {/* Column 4: Camera ID & Location */}
                          <td style={styles.td}>
                            <div style={styles.locationBlock}>
                              <div style={styles.cameraName}>
                                <Camera size={13} color="#64748b" />
                                <span style={styles.camMonoId}>{item.camera_id}</span>
                              </div>
                              <div style={styles.camLocationText}>
                                <MapPin size={12} color="#94a3b8" />
                                <span>
                                  {camInfo ? `${camInfo.location} - ${camInfo.sub_location}` : 'ไม่ระบุสถานที่'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Column 5: Timestamp */}
                          <td style={styles.td}>
                            <div style={styles.timeMain}>
                              {item.created_at ? new Date(item.created_at).toLocaleTimeString() : '-'}
                            </div>
                            <div style={styles.subTextMuted}>
                              {item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}
                            </div>
                          </td>

                          {/* Column 6: Action Button */}
                          <td style={{ ...styles.td, textAlign: 'center' }}>
                            <button
                              onClick={() => setSelectedEvent(item)}
                              style={styles.viewDetailsBtn}
                              title="ดูรายละเอียดและภาพหลักฐาน"
                            >
                              <Eye size={14} />
                              <span>ดูภาพ</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Card Footer Link */}
            <div style={styles.cardFooter}>
              <span style={styles.cardFooterNote}>
                แสดงเหตุการณ์ล่าสุด {Math.min(6, filteredDetections.length)} จากทั้งหมด {filteredDetections.length} รายการ
              </span>
              <Link to="/events" style={styles.footerLink}>
                <span>ดูประวัติเหตุการณ์ทั้งหมด</span>
                <ArrowUpRight size={15} />
              </Link>
            </div>
          </div>

          {/* Right Column: Analytics & Camera Matrix */}
          <div style={styles.rightColumn}>
            {/* Widget 1: Analytics */}
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
                    รวม {totalFireDetections + totalSmokeDetections} ครั้ง ({recentDetections.length} เหตุการณ์)
                  </span>
                </div>

                {totalFireDetections + totalSmokeDetections > 0 ? (
                  <div style={styles.stackedBar}>
                    <div
                      style={{
                        ...styles.barSegmentFire,
                        width: `${(totalFireDetections / (totalFireDetections + totalSmokeDetections)) * 100}%`,
                      }}
                      title={`ไฟ: ${totalFireDetections} ครั้ง`}
                    />
                    <div
                      style={{
                        ...styles.barSegmentSmoke,
                        width: `${(totalSmokeDetections / (totalFireDetections + totalSmokeDetections)) * 100}%`,
                      }}
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
                        {totalFireDetections}{' '}
                        <span style={styles.legendPct}>
                          ({totalFireDetections + totalSmokeDetections > 0
                            ? Math.round((totalFireDetections / (totalFireDetections + totalSmokeDetections)) * 100)
                            : 0}
                          %)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={styles.legendItem}>
                    <div style={styles.legendIndicatorSmoke} />
                    <div>
                      <div style={styles.legendLabel}>กลุ่มควัน (Smoke)</div>
                      <div style={styles.legendNum}>
                        {totalSmokeDetections}{' '}
                        <span style={styles.legendPct}>
                          ({totalFireDetections + totalSmokeDetections > 0
                            ? Math.round((totalSmokeDetections / (totalFireDetections + totalSmokeDetections)) * 100)
                            : 0}
                          %)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

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
              </div>
            </div>

            {/* Widget 2: Camera Status Matrix */}
            <div style={styles.sideCard} className="dash-card">
              <div style={styles.sideCardHeader}>
                <div style={styles.cardTitleWithIcon}>
                  <Video size={17} color="#059669" />
                  <h3 style={styles.sideCardTitle}>สถานะกล้องในระบบ ({totalCameras})</h3>
                </div>
                <Link to="/cameras" style={styles.smallManageLink}>
                  <span>จัดการกล้อง</span>
                  <ArrowUpRight size={13} />
                </Link>
              </div>

              {cameras.length === 0 ? (
                <div style={styles.sideEmpty}>
                  <Camera size={24} color="#94a3b8" />
                  <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                    ไม่พบกล้องที่ลงทะเบียนไว้ในระบบ
                  </p>
                </div>
              ) : (
                <div style={styles.cameraListScroll}>
                  {cameras.map((cam) => {
                    const online = isCameraOnline(cam);
                    const isMaint = cam.status === 'maintenance';

                    return (
                      <div key={cam.camera_id || cam.id} style={styles.camListItem}>
                        <div style={styles.camItemLeft}>
                          <div
                            style={{
                              ...styles.camStatusDot,
                              backgroundColor: online ? '#10b981' : isMaint ? '#f59e0b' : '#ef4444',
                            }}
                            title={`สถานะ: ${cam.status}`}
                          />
                          <div>
                            <div style={styles.camItemName}>
                              <span>{cam.camera_id || cam.id}</span>
                              <span style={styles.camIpTag}>{cam.ip_address || 'IP ไม่ระบุ'}</span>
                            </div>
                            <div style={styles.camItemLocation}>
                              <MapPin size={11} color="#94a3b8" />
                              <span>{cam.location} • {cam.sub_location}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <span
                            style={{
                              ...styles.camMiniBadge,
                              backgroundColor: online ? '#dcfce7' : isMaint ? '#fef3c7' : '#fee2e2',
                              color: online ? '#15803d' : isMaint ? '#b45309' : '#b91c1c',
                            }}
                          >
                            {online ? 'Active' : isMaint ? 'Maintenance' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal: Detection Snapshot & Full Event Details */}
        {selectedEvent && (() => {
          const selectedParsed = parseEventDetections(selectedEvent);
          return (
            <div style={styles.modalBackdrop} onClick={() => setSelectedEvent(null)}>
              <div style={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
                {/* Modal Header */}
                <div style={styles.modalHeader}>
                  <div style={styles.modalHeaderTitleRow}>
                    <Flame size={20} color="#dc2626" />
                    <div>
                      <h3 style={styles.modalTitle}>
                        รายละเอียดเหตุการณ์ {selectedEvent.event_id}
                      </h3>
                      <div style={styles.modalSubtitle}>
                        บันทึกเมื่อ: {selectedEvent.created_at ? new Date(selectedEvent.created_at).toLocaleString('th-TH') : '-'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    style={styles.modalCloseBtn}
                    title="ปิดหน้าต่าง"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Modal Body */}
                <div style={styles.modalBody}>
                  {/* Snapshot Image Container */}
                  <div style={styles.modalImageContainer}>
                    {selectedEvent.image_url ? (
                      <img
                        src={getFullImageUrl(selectedEvent.image_url)}
                        alt={`Snapshot ${selectedEvent.event_id}`}
                        style={styles.modalImage}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          if (e.target.nextSibling) {
                            e.target.nextSibling.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <div
                      style={{
                        ...styles.modalImageFallback,
                        display: selectedEvent.image_url ? 'none' : 'flex',
                      }}
                    >
                      <Camera size={40} color="#94a3b8" />
                      <p style={{ marginTop: '8px', color: '#64748b', fontSize: '14px' }}>
                        ไม่มีภาพ Snapshot บันทึกไว้สำหรับเหตุการณ์นี้
                      </p>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div style={styles.modalDetailsGrid}>
                    <div style={styles.modalDetailCard}>
                      <span style={styles.modalDetailLabel}>ประเภทที่ตรวจจับได้</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                        {selectedParsed.types.map((t) => {
                          const isF = t.type === 'fire';
                          const isS = t.type === 'smoke';
                          return (
                            <span
                              key={t.type}
                              style={{
                                ...styles.typeBadge,
                                backgroundColor: isF ? '#fee2e2' : isS ? '#fef3c7' : '#f1f5f9',
                                color: isF ? '#b91c1c' : isS ? '#b45309' : '#475569',
                                border: `1px solid ${isF ? '#fecaca' : isS ? '#fde68a' : '#e2e8f0'}`,
                              }}
                            >
                              {isF ? <Flame size={12} /> : isS ? <AlertTriangle size={12} /> : null}
                              <span>
                                {t.label} {t.count > 1 ? `(${t.count})` : ''}
                              </span>
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div style={styles.modalDetailCard}>
                      <span style={styles.modalDetailLabel}>ความมั่นใจสูงสุดของ AI</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                        {selectedParsed.types.map((t) => (
                          <div key={t.type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>{t.label}:</span>
                            <span style={{ fontSize: '15px', fontWeight: '700', color: t.type === 'fire' ? '#dc2626' : '#d97706' }}>
                              {(t.maxConfidence * 100).toFixed(1)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={styles.modalDetailCard}>
                      <span style={styles.modalDetailLabel}>กล้องวงจรปิด</span>
                      <div style={styles.modalDetailValueMono}>{selectedEvent.camera_id || '-'}</div>
                      <div style={styles.modalDetailSub}>
                        IP: {camerasMap[selectedEvent.camera_id]?.ip_address || '-'}
                      </div>
                    </div>

                    <div style={styles.modalDetailCard}>
                      <span style={styles.modalDetailLabel}>ตำแหน่งที่เกิดเหตุ</span>
                      <div style={styles.modalDetailValue}>
                        {camerasMap[selectedEvent.camera_id]?.location || 'ไม่ระบุอาคาร'}
                      </div>
                      <div style={styles.modalDetailSub}>
                        {camerasMap[selectedEvent.camera_id]?.sub_location || '-'}
                      </div>
                    </div>
                  </div>

                  {/* Bounding Box Detail List */}
                  {selectedParsed.details && selectedParsed.details.length > 0 && (
                    <div style={styles.bboxSection}>
                      <span style={styles.bboxSectionTitle}>
                        พิกัดตรวจจับ Bounding Boxes ทั้งหมด ({selectedParsed.details.length} วัตถุ)
                      </span>
                      <div style={styles.bboxGridScroll}>
                        {selectedParsed.details.map((box, bIdx) => {
                          const isF = (box.detection_type || '').toLowerCase().includes('fire');
                          return (
                            <div key={box.id || bIdx} style={styles.bboxItem}>
                              <div style={styles.bboxItemTop}>
                                <span style={{ fontWeight: '600', color: isF ? '#b91c1c' : '#b45309' }}>
                                  #{bIdx + 1} {box.detection_type?.toUpperCase()}
                                </span>
                                <span style={{ color: '#059669', fontWeight: '700' }}>
                                  {typeof box.confidence === 'number' ? `${(box.confidence * 100).toFixed(1)}%` : '-'}
                                </span>
                              </div>
                              <div style={styles.bboxCoords}>
                                Center: ({box.box_center_x}, {box.box_center_y}) | Size: {box.box_width}x{box.box_height}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div style={styles.modalFooter}>
                  <Link
                    to="/events"
                    style={styles.modalFullHistoryBtn}
                    onClick={() => setSelectedEvent(null)}
                  >
                    <span>เปิดดูในหน้ารายงานประวัติ</span>
                    <ArrowUpRight size={15} />
                  </Link>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    style={styles.modalDismissBtn}
                  >
                    ปิดหน้าต่าง
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </MainLayout>
  );
};

const styles = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    maxWidth: '1600px',
    margin: '0 auto',
  },

  // Header Bar
  headerBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
    paddingBottom: '4px',
  },
  headerTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  headerTitle: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: '-0.5px',
  },
  headerSubtitle: {
    margin: '4px 0 0 0',
    fontSize: '14px',
    color: '#64748b',
  },
  livePill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#ecfdf5',
    border: '1px solid #a7f3d0',
    padding: '4px 10px',
    borderRadius: '9999px',
  },
  liveDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
  },
  liveDotSmall: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#ef4444',
  },
  liveText: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#047857',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  lastUpdateText: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#64748b',
    backgroundColor: '#ffffff',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  refreshBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    backgroundColor: '#ffffff',
    color: '#2563eb',
    border: '1px solid #bfdbfe',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },

  // Alert Banners
  dangerAlertBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '12px',
    padding: '16px 20px',
    boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.08)',
    flexWrap: 'wrap',
  },
  alertBannerIconWrapperDanger: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    backgroundColor: '#fee2e2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  alertTitleDanger: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#991b1b',
  },
  alertSubtitleDanger: {
    fontSize: '13px',
    color: '#b91c1c',
    marginTop: '2px',
  },
  alertActionBtnDanger: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    backgroundColor: '#dc2626',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },

  safeAlertBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '12px',
    padding: '14px 20px',
    flexWrap: 'wrap',
  },
  alertBannerIconWrapperSafe: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: '#dcfce7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  alertTitleSafe: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#166534',
  },
  alertSubtitleSafe: {
    fontSize: '13px',
    color: '#15803d',
    marginTop: '2px',
  },
  safeBadgePill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#dcfce7',
    padding: '6px 12px',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#166534',
  },

  // 4 Stat Cards
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    padding: '20px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  statCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statCardTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#64748b',
  },
  statIconBadge: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCardValue: {
    fontSize: '30px',
    fontWeight: '700',
    color: '#0f172a',
    marginTop: '10px',
    letterSpacing: '-0.5px',
  },
  statCardFooter: {
    marginTop: '12px',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  progressContainer: {
    width: '100%',
    height: '6px',
    backgroundColor: '#f1f5f9',
    borderRadius: '9999px',
    overflow: 'hidden',
    marginTop: '10px',
  },
  progressBar: {
    height: '100%',
    borderRadius: '9999px',
    transition: 'width 0.4s ease-in-out',
  },
  statCardSubText: {
    fontSize: '12px',
    color: '#64748b',
    marginTop: '8px',
  },
  detectionPillsRow: {
    display: 'flex',
    gap: '8px',
    marginTop: '10px',
  },
  miniFirePill: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#b91c1c',
    backgroundColor: '#fee2e2',
    padding: '2px 8px',
    borderRadius: '6px',
  },
  miniSmokePill: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#b45309',
    backgroundColor: '#fef3c7',
    padding: '2px 8px',
    borderRadius: '6px',
  },

  // Main Split Grid
  splitGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.65fr) minmax(0, 1fr)',
    gap: '24px',
    alignItems: 'start',
  },

  // Left Column Card
  mainCard: {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    overflow: 'hidden',
  },
  cardHeaderArea: {
    padding: '18px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #f1f5f9',
    flexWrap: 'wrap',
    gap: '12px',
  },
  cardHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  cardTitleWithIcon: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  cardTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '700',
    color: '#0f172a',
  },
  badgeLivePulse: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '9999px',
    textTransform: 'uppercase',
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    padding: '3px',
    borderRadius: '8px',
    gap: '2px',
  },
  filterTab: {
    padding: '5px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    color: '#64748b',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
  },
  filterTabActive: {
    backgroundColor: '#ffffff',
    color: '#0f172a',
    fontWeight: '600',
    boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
  },
  filterTabActiveFire: {
    backgroundColor: '#dc2626',
    color: '#ffffff',
    fontWeight: '600',
    boxShadow: '0 1px 2px rgba(220, 38, 38, 0.2)',
  },
  filterTabActiveSmoke: {
    backgroundColor: '#d97706',
    color: '#ffffff',
    fontWeight: '600',
    boxShadow: '0 1px 2px rgba(217, 119, 6, 0.2)',
  },

  // Table
  tableScroll: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '13px',
  },
  tableHeadRow: {
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
    color: '#475569',
  },
  th: {
    padding: '12px 14px',
    fontSize: '12px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
  },
  tableRow: {
    borderBottom: '1px solid #f1f5f9',
    transition: 'background-color 0.15s',
  },
  td: {
    padding: '12px 14px',
    verticalAlign: 'middle',
  },

  eventIdText: {
    fontWeight: '600',
    color: '#0f172a',
    fontFamily: 'monospace',
    fontSize: '13px',
  },
  subTextMuted: {
    fontSize: '11px',
    color: '#94a3b8',
    marginTop: '2px',
  },

  // Multi-type badges container
  typeBadgesContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    alignItems: 'flex-start',
  },
  typeBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 9px',
    borderRadius: '9999px',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.3px',
    whiteSpace: 'nowrap',
  },

  // Confidence cells list
  confColumnList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    width: '95px',
  },
  confCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  confRowHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '11px',
  },
  confLabelType: {
    fontSize: '10px',
    color: '#64748b',
    fontWeight: '600',
  },
  confValueText: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#0f172a',
  },
  confBarBg: {
    width: '100%',
    height: '4px',
    backgroundColor: '#e2e8f0',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  confBarFill: {
    height: '100%',
    borderRadius: '2px',
  },

  locationBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  cameraName: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  camMonoId: {
    fontFamily: 'monospace',
    fontWeight: '600',
    color: '#334155',
    fontSize: '12px',
  },
  camLocationText: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    color: '#64748b',
  },
  timeMain: {
    fontWeight: '500',
    color: '#1e293b',
    fontSize: '13px',
  },
  viewDetailsBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '6px 12px',
    backgroundColor: '#f1f5f9',
    color: '#1e293b',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },

  // Card Footer
  cardFooter: {
    padding: '14px 24px',
    backgroundColor: '#f8fafc',
    borderTop: '1px solid #f1f5f9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '13px',
  },
  cardFooterNote: {
    color: '#64748b',
    fontSize: '12px',
  },
  footerLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    color: '#2563eb',
    fontWeight: '600',
    textDecoration: 'none',
  },

  // Right Column
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  sideCard: {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    overflow: 'hidden',
  },
  sideCardHeader: {
    padding: '18px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #f1f5f9',
  },
  sideCardTitle: {
    margin: 0,
    fontSize: '15px',
    fontWeight: '700',
    color: '#0f172a',
  },
  smallManageLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#2563eb',
    textDecoration: 'none',
  },
  analyticsBody: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  ratioHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subLabel: {
    fontSize: '13px',
    color: '#64748b',
    fontWeight: '500',
  },
  subValue: {
    fontSize: '12px',
    color: '#0f172a',
    fontWeight: '600',
  },
  stackedBar: {
    width: '100%',
    height: '10px',
    backgroundColor: '#f1f5f9',
    borderRadius: '9999px',
    display: 'flex',
    overflow: 'hidden',
  },
  stackedBarEmpty: {
    width: '100%',
    height: '10px',
    backgroundColor: '#f1f5f9',
    borderRadius: '9999px',
  },
  barSegmentFire: {
    height: '100%',
    backgroundColor: '#ef4444',
    transition: 'width 0.4s ease',
  },
  barSegmentSmoke: {
    height: '100%',
    backgroundColor: '#f59e0b',
    transition: 'width 0.4s ease',
  },
  legendGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#f8fafc',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #f1f5f9',
  },
  legendIndicatorFire: {
    width: '10px',
    height: '10px',
    borderRadius: '3px',
    backgroundColor: '#ef4444',
    flexShrink: 0,
  },
  legendIndicatorSmoke: {
    width: '10px',
    height: '10px',
    borderRadius: '3px',
    backgroundColor: '#f59e0b',
    flexShrink: 0,
  },
  legendLabel: {
    fontSize: '11px',
    color: '#64748b',
    fontWeight: '500',
  },
  legendNum: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#0f172a',
  },
  legendPct: {
    fontSize: '11px',
    fontWeight: '500',
    color: '#64748b',
  },
  confidenceMetricBox: {
    backgroundColor: '#f8fafc',
    padding: '12px 14px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },

  // Camera List
  cameraListScroll: {
    maxHeight: '340px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
  camListItem: {
    padding: '12px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #f1f5f9',
  },
  camItemLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  camStatusDot: {
    width: '9px',
    height: '9px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  camItemName: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#0f172a',
    fontFamily: 'monospace',
  },
  camIpTag: {
    fontSize: '11px',
    color: '#64748b',
    fontWeight: '400',
  },
  camItemLocation: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    color: '#64748b',
    marginTop: '2px',
  },
  camMiniBadge: {
    fontSize: '11px',
    fontWeight: '600',
    padding: '3px 8px',
    borderRadius: '9999px',
  },

  // Empty & Loading states
  loadingArea: {
    padding: '50px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyArea: {
    padding: '50px 20px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  emptyIconCircle: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: '#f0fdf4',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '12px',
  },
  emptyTitle: {
    margin: '0 0 6px 0',
    fontSize: '15px',
    fontWeight: '600',
    color: '#1e293b',
  },
  emptyDesc: {
    margin: 0,
    fontSize: '13px',
    color: '#64748b',
    maxWidth: '380px',
    lineHeight: '1.5',
  },
  sideEmpty: {
    padding: '36px 20px',
    textAlign: 'center',
  },

  // Modal Styles
  modalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(3px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1050,
    padding: '20px',
  },
  modalContainer: {
    width: '100%',
    maxWidth: '680px',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '90vh',
  },
  modalHeader: {
    padding: '18px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
  },
  modalHeaderTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  modalTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '700',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: '12px',
    color: '#64748b',
    marginTop: '2px',
  },
  modalCloseBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#475569',
  },
  modalBody: {
    padding: '24px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  modalImageContainer: {
    width: '100%',
    height: '320px',
    minHeight: '320px',
    maxHeight: '320px',
    borderRadius: '12px',
    backgroundColor: '#0f172a',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #e2e8f0',
    flexShrink: 0,
  },
  modalImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  modalImageFallback: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    width: '100%',
    height: '100%',
  },
  modalDetailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  },
  modalDetailCard: {
    backgroundColor: '#f8fafc',
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
  },
  modalDetailLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  modalDetailValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#0f172a',
    marginTop: '4px',
  },
  modalDetailValueMono: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#0f172a',
    fontFamily: 'monospace',
    marginTop: '4px',
  },
  modalDetailSub: {
    fontSize: '12px',
    color: '#64748b',
    marginTop: '2px',
  },
  bboxSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  bboxSectionTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#334155',
  },
  bboxGridScroll: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '180px',
    overflowY: 'auto',
    paddingRight: '4px',
  },
  bboxItem: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '12px',
  },
  bboxItemTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  bboxCoords: {
    color: '#64748b',
    fontFamily: 'monospace',
    fontSize: '11px',
  },
  modalFooter: {
    padding: '16px 24px',
    borderTop: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalFullHistoryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    color: '#2563eb',
    fontSize: '13px',
    fontWeight: '600',
    textDecoration: 'none',
  },
  modalDismissBtn: {
    padding: '8px 18px',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};

export default Dashboard;