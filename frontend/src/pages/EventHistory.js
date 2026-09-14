import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import {
  Flame,
  Camera,
  Calendar,
  Search,
  Download,
  RefreshCw,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  Layers,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:8080/api';
const BACKEND_BASE_URL = 'http://localhost:8080';
const ITEMS_PER_PAGE = 10;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

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

// Helper to parse all detection details from an event
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

const EventHistory = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'fire' | 'smoke' | 'both'
  const [cameraFilter, setCameraFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination & Modal State
  const [currentPage, setCurrentPage] = useState(1);
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

  const fetchData = useCallback(async (isManual = false) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    if (isManual) setIsRefreshing(true);

    try {
      const [userRes, eventsRes, camRes] = await Promise.allSettled([
        axios.get(`${API_BASE_URL}/me`, getAuthHeaders()),
        axios.get(`${API_BASE_URL}/detections`, getAuthHeaders()),
        axios.get(`${API_BASE_URL}/cameras`, getAuthHeaders()),
      ]);

      if (
        userRes.status === 'rejected' &&
        userRes.reason?.response?.status === 401
      ) {
        handleSessionExpired();
        return;
      }

      if (!isMountedRef.current) return;

      if (userRes.status === 'fulfilled') setUser(userRes.value.data);
      if (eventsRes.status === 'fulfilled') setEvents(eventsRes.value.data || []);
      if (camRes.status === 'fulfilled') setCameras(camRes.value.data || []);
    } catch (err) {
      console.error('Error fetching event history:', err);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        if (isManual) setIsRefreshing(false);
      }
    }
  }, [navigate, handleSessionExpired]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fast camera map by ID
  const camerasMap = useMemo(() => {
    const map = {};
    cameras.forEach((cam) => {
      if (cam.camera_id) map[cam.camera_id] = cam;
      if (cam.id) map[cam.id] = cam;
    });
    return map;
  }, [cameras]);

  // Global counts
  const { totalCount, fireCount, smokeCount, todayCount } = useMemo(() => {
    const todayStr = new Date().toDateString();
    let fCount = 0;
    let sCount = 0;
    let tCount = 0;

    events.forEach((evt) => {
      const parsed = parseEventDetections(evt);
      if (parsed.hasFire) fCount++;
      if (parsed.hasSmoke) sCount++;
      if (evt.created_at && new Date(evt.created_at).toDateString() === todayStr) {
        tCount++;
      }
    });

    return {
      totalCount: events.length,
      fireCount: fCount,
      smokeCount: sCount,
      todayCount: tCount,
    };
  }, [events]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      const parsed = parseEventDetections(evt);
      const cam = camerasMap[evt.camera_id];

      // 1. Search filter (Event ID, Camera ID, Location, Sub-location)
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const eventId = (evt.event_id || '').toLowerCase();
        const camId = (evt.camera_id || '').toLowerCase();
        const location = (cam?.location || '').toLowerCase();
        const subLocation = (cam?.sub_location || '').toLowerCase();

        const matches =
          eventId.includes(q) ||
          camId.includes(q) ||
          location.includes(q) ||
          subLocation.includes(q);

        if (!matches) return false;
      }

      // 2. Type filter
      if (typeFilter === 'fire' && !parsed.hasFire) return false;
      if (typeFilter === 'smoke' && !parsed.hasSmoke) return false;
      if (typeFilter === 'both' && !parsed.hasBoth) return false;

      // 3. Camera filter
      if (cameraFilter !== 'all' && evt.camera_id !== cameraFilter) {
        return false;
      }

      // 4. Date range filter
      if (startDate && evt.created_at) {
        const eventDate = new Date(evt.created_at);
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (eventDate < start) return false;
      }

      if (endDate && evt.created_at) {
        const eventDate = new Date(evt.created_at);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (eventDate > end) return false;
      }

      return true;
    });
  }, [events, searchTerm, typeFilter, cameraFilter, startDate, endDate, camerasMap]);

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, cameraFilter, startDate, endDate]);

  // Paginated Events
  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE) || 1;
  const paginatedEvents = useMemo(() => {
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEvents.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  }, [filteredEvents, currentPage]);

  // Reset filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setCameraFilter('all');
    setStartDate('');
    setEndDate('');
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredEvents.length === 0) {
      alert('ไม่มีข้อมูลให้ส่งออก');
      return;
    }

    const headers = [
      'Event ID',
      'วันที่และเวลา',
      'รหัสกล้อง',
      'สถานที่',
      'จุดย่อย',
      'ประเภทที่ตรวจพบ',
      'ความมั่นใจไฟ (%)',
      'ความมั่นใจควัน (%)',
      'URL ภาพ',
    ];

    const rows = filteredEvents.map((evt) => {
      const parsed = parseEventDetections(evt);
      const cam = camerasMap[evt.camera_id];
      const typesStr = parsed.types.map((t) => `${t.label}(${t.count})`).join('; ');
      const fireConf = parsed.hasFire ? (parsed.maxFireConfidence * 100).toFixed(1) : '-';
      const smokeConf = parsed.hasSmoke ? (parsed.maxSmokeConfidence * 100).toFixed(1) : '-';
      const dateStr = evt.created_at ? new Date(evt.created_at).toLocaleString('th-TH') : '-';
      const fullImg = getFullImageUrl(evt.image_url) || '';

      return [
        `"${evt.event_id || ''}"`,
        `"${dateStr}"`,
        `"${evt.camera_id || ''}"`,
        `"${cam?.location || ''}"`,
        `"${cam?.sub_location || ''}"`,
        `"${typesStr}"`,
        `"${fireConf}"`,
        `"${smokeConf}"`,
        `"${fullImg}"`,
      ].join(',');
    });

    // UTF-8 BOM for Excel Thai compatibility
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `event_history_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <MainLayout
      title="Event History"
      username={user?.username || 'User'}
      userRole={user?.role || 'user'}
    >
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin-icon {
          animation: spin 0.8s linear infinite;
        }
        .interactive-row:hover {
          background-color: #f8fafc !important;
        }
        .filter-input:focus {
          border-color: #2563eb !important;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1) !important;
        }
      `}</style>

      <div style={styles.page}>
        {/* Top Header Bar */}
        <div style={styles.headerBar}>
          <div>
            <h1 style={styles.headerTitle}>ประวัติเหตุการณ์ตรวจจับ</h1>
            <p style={styles.headerSubtitle}>
              ค้นหา กรอง และตรวจสอบบันทึกหลักฐานการตรวจจับไฟและควันย้อนหลังทั้งหมด
            </p>
          </div>

          <div style={styles.headerActions}>
            <button
              onClick={() => fetchData(true)}
              disabled={isRefreshing}
              style={styles.refreshBtn}
              title="กดเพื่อรีเฟรชข้อมูลล่าสุด"
            >
              <RefreshCw size={15} className={isRefreshing ? 'spin-icon' : ''} />
              <span>รีเฟรช</span>
            </button>

            <button
              onClick={handleExportCSV}
              style={styles.exportBtn}
              title="ดาวน์โหลดข้อมูลเป็นไฟล์ Excel / CSV"
            >
              <Download size={15} />
              <span>ส่งออก CSV</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Metric Cards */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statHeader}>
              <span style={styles.statLabel}>เหตุการณ์ทั้งหมด</span>
              <div style={{ ...styles.statIconBadge, backgroundColor: '#eff6ff', color: '#2563eb' }}>
                <Layers size={18} />
              </div>
            </div>
            <div style={styles.statNumber}>{totalCount}</div>
            <div style={styles.statSub}>บันทึกในฐานข้อมูลทั้งหมด</div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statHeader}>
              <span style={styles.statLabel}>พบเปลวไฟ (Fire)</span>
              <div style={{ ...styles.statIconBadge, backgroundColor: '#fee2e2', color: '#dc2626' }}>
                <Flame size={18} />
              </div>
            </div>
            <div style={{ ...styles.statNumber, color: '#dc2626' }}>{fireCount}</div>
            <div style={styles.statSub}>เหตุการณ์ที่มีสัญญาณไฟไหม้</div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statHeader}>
              <span style={styles.statLabel}>พบกลุ่มควัน (Smoke)</span>
              <div style={{ ...styles.statIconBadge, backgroundColor: '#fef3c7', color: '#d97706' }}>
                <AlertTriangle size={18} />
              </div>
            </div>
            <div style={{ ...styles.statNumber, color: '#d97706' }}>{smokeCount}</div>
            <div style={styles.statSub}>เหตุการณ์ที่มีสัญญาณกลุ่มควัน</div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statHeader}>
              <span style={styles.statLabel}>เกิดขึ้นวันนี้</span>
              <div style={{ ...styles.statIconBadge, backgroundColor: '#f0fdf4', color: '#16a34a' }}>
                <Clock size={18} />
              </div>
            </div>
            <div style={{ ...styles.statNumber, color: '#16a34a' }}>{todayCount}</div>
            <div style={styles.statSub}>เหตุการณ์ประจำวันปัจจุบัน</div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div style={styles.filterCard}>
          <div style={styles.filterTitleRow}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={16} color="#2563eb" />
              <span style={styles.filterSectionTitle}>ตัวกรองและค้นหาข้อมูล</span>
            </div>
            {(searchTerm || typeFilter !== 'all' || cameraFilter !== 'all' || startDate || endDate) && (
              <button onClick={handleResetFilters} style={styles.resetFilterBtn}>
                <RotateCcw size={13} />
                <span>ล้างตัวกรอง</span>
              </button>
            )}
          </div>

          <div style={styles.filterGrid}>
            {/* Search Input */}
            <div style={styles.filterItem}>
              <label style={styles.filterLabel}>ค้นหาคำสำคัญ</label>
              <div style={styles.searchInputWrapper}>
                <Search size={16} color="#94a3b8" style={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Event ID, รหัสกล้อง, สถานที่"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={styles.searchInput}
                  className="filter-input"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    style={styles.clearSearchBtn}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Type Filter */}
            <div style={styles.filterItem}>
              <label style={styles.filterLabel}>ประเภทเหตุการณ์</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                style={styles.selectInput}
                className="filter-input"
              >
                <option value="all">ทั้งหมด (All Types)</option>
                <option value="fire">🔥 เปลวไฟ (Fire)</option>
                <option value="smoke">💨 กลุ่มควัน (Smoke)</option>
                <option value="both">⚡ มีทั้งไฟและควัน (Both)</option>
              </select>
            </div>

            {/* Camera Filter */}
            <div style={styles.filterItem}>
              <label style={styles.filterLabel}>กล้องวงจรปิด</label>
              <select
                value={cameraFilter}
                onChange={(e) => setCameraFilter(e.target.value)}
                style={styles.selectInput}
                className="filter-input"
              >
                <option value="all">กล้องทุกตัว (All Cameras)</option>
                {cameras.map((cam) => (
                  <option key={cam.camera_id || cam.id} value={cam.camera_id || cam.id}>
                    {cam.camera_id || cam.id} - {cam.location} - {cam.sub_location}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div style={styles.filterItem}>
              <label style={styles.filterLabel}>ช่วงวันที่เกิดเหตุ</label>
              <div style={styles.dateRangeRow}>
                <div style={styles.dateInputWrapper}>
                  <Calendar size={14} color="#94a3b8" style={styles.dateIcon} />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={styles.dateInput}
                    title="วันที่เริ่มต้น"
                    className="filter-input"
                  />
                </div>
                <span style={{ color: '#94a3b8', fontSize: '13px' }}>ถึง</span>
                <div style={styles.dateInputWrapper}>
                  <Calendar size={14} color="#94a3b8" style={styles.dateIcon} />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={styles.dateInput}
                    title="วันที่สิ้นสุด"
                    className="filter-input"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Count & Active Filter Indicator */}
        <div style={styles.resultsBar}>
          <span style={styles.resultsText}>
            พบทั้งหมด <strong>{filteredEvents.length}</strong> รายการ
            {filteredEvents.length !== totalCount && ` (กรองจาก ${totalCount} รายการ)`}
          </span>
          <span style={styles.pageIndicator}>
            หน้า {currentPage} จาก {totalPages}
          </span>
        </div>

        {/* Main Table Card */}
        <div style={styles.tableCard}>
          {loading ? (
            <div style={styles.loadingArea}>
              <RefreshCw size={28} className="spin-icon" color="#2563eb" />
              <p style={{ marginTop: '12px', color: '#64748b', fontSize: '14px' }}>
                กำลังเชื่อมต่อและโหลดข้อมูลประวัติเหตุการณ์...
              </p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div style={styles.emptyArea}>
              <div style={styles.emptyIconCircle}>
                <CheckCircle2 size={36} color="#16a34a" />
              </div>
              <h3 style={styles.emptyTitle}>ไม่พบข้อมูลตามเงื่อนไขที่ค้นหา</h3>
              <p style={styles.emptyDesc}>
                กรุณาปรับเปลี่ยนคำค้นหา หรือกดปุ่ม "ล้างตัวกรอง" เพื่อแสดงข้อมูลประวัติทั้งหมด
              </p>
              <button onClick={handleResetFilters} style={styles.emptyResetBtn}>
                <RotateCcw size={14} />
                <span>ล้างตัวกรองทั้งหมด</span>
              </button>
            </div>
          ) : (
            <div style={styles.tableScroll}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeadRow}>
                    <th style={{ ...styles.th, width: '68px', textAlign: 'center' }}>ภาพ Snapshot</th>
                    <th style={styles.th}>Event ID</th>
                    <th style={styles.th}>ประเภทที่ตรวจพบ</th>
                    <th style={styles.th}>ความมั่นใจ (AI)</th>
                    <th style={styles.th}>กล้อง & ตำแหน่ง</th>
                    <th style={styles.th}>วันและเวลาที่บันทึก</th>
                    <th style={{ ...styles.th, textAlign: 'center' }}>การกระทำ</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedEvents.map((item, index) => {
                    const parsed = parseEventDetections(item);
                    const camInfo = camerasMap[item.camera_id];
                    const fullImgUrl = getFullImageUrl(item.image_url);

                    return (
                      <tr
                        key={item.event_id || index}
                        style={styles.tableRow}
                        className="interactive-row"
                      >
                        {/* Column 1: Snapshot Thumbnail (Fixed Strict Size: 52px x 52px) */}
                        <td style={{ ...styles.td, width: '68px', textAlign: 'center' }}>
                          <div
                            style={styles.thumbWrapper}
                            onClick={() => setSelectedEvent(item)}
                            title="คลิกเพื่อดูภาพขยาย"
                          >
                            {fullImgUrl ? (
                              <img
                                src={fullImgUrl}
                                alt={item.event_id}
                                style={styles.thumbImage}
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
                                ...styles.thumbPlaceholder,
                                display: fullImgUrl ? 'none' : 'flex',
                              }}
                            >
                              {parsed.hasFire ? (
                                <Flame size={18} color="#ef4444" />
                              ) : (
                                <Layers size={18} color="#64748b" />
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Column 2: Event ID & Sub-info */}
                        <td style={styles.td}>
                          <div style={styles.eventIdText}>{item.event_id || `EVT-#${index + 1}`}</div>
                          <div style={styles.subTextMuted}>{formatTimeAgo(item.created_at)}</div>
                        </td>

                        {/* Column 3: Types Detected (Supports Both Fire and Smoke in the same event!) */}
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

                        {/* Column 4: Confidence Score for Each Detected Type */}
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

                        {/* Column 5: Camera ID & Location */}
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

                        {/* Column 6: Timestamp */}
                        <td style={styles.td}>
                          <div style={styles.timeMain}>
                            {item.created_at ? new Date(item.created_at).toLocaleTimeString() : '-'}
                          </div>
                          <div style={styles.subTextMuted}>
                            {item.created_at ? new Date(item.created_at).toLocaleDateString('th-TH') : '-'}
                          </div>
                        </td>

                        {/* Column 7: Action Button */}
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

          {/* Pagination Footer */}
          {filteredEvents.length > 0 && (
            <div style={styles.paginationFooter}>
              <div style={styles.paginationInfo}>
                แสดง {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{' '}
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredEvents.length)} จากทั้งหมด{' '}
                {filteredEvents.length} รายการ
              </div>

              <div style={styles.paginationControls}>
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  style={{
                    ...styles.pageBtn,
                    opacity: currentPage === 1 ? 0.4 : 1,
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  }}
                  title="หน้าก่อนหน้า"
                >
                  <ChevronLeft size={16} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((p, idx, arr) => {
                    const prevP = arr[idx - 1];
                    const showEllipsis = prevP && p - prevP > 1;

                    return (
                      <React.Fragment key={p}>
                        {showEllipsis && <span style={styles.pageEllipsis}>...</span>}
                        <button
                          onClick={() => setCurrentPage(p)}
                          style={{
                            ...styles.pageNumBtn,
                            ...(currentPage === p ? styles.pageNumBtnActive : {}),
                          }}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  style={{
                    ...styles.pageBtn,
                    opacity: currentPage === totalPages ? 0.4 : 1,
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  }}
                  title="หน้าถัดไป"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal: Detection Snapshot & Full Event Details */}
        {selectedEvent && (() => {
          const selectedParsed = parseEventDetections(selectedEvent);
          const fullImgUrl = getFullImageUrl(selectedEvent.image_url);

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
                  {/* Snapshot Image Container (Strict fixed height 320px, never resizes) */}
                  <div style={styles.modalImageContainer}>
                    {fullImgUrl ? (
                      <img
                        src={fullImgUrl}
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
                        display: fullImgUrl ? 'none' : 'flex',
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

                  {/* Bounding Box Detail List (Scrollable, won't resize image) */}
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
                  {fullImgUrl ? (
                    <a
                      href={fullImgUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.openTabLink}
                    >
                      <ExternalLink size={14} />
                      <span>เปิดภาพเต็มในแท็บใหม่</span>
                    </a>
                  ) : <div />}
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
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
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
  exportBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 18px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
  },

  // 4 Metric Cards
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    padding: '18px 20px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  statHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
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
  statNumber: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#0f172a',
    marginTop: '8px',
    letterSpacing: '-0.5px',
  },
  statSub: {
    fontSize: '12px',
    color: '#94a3b8',
    marginTop: '4px',
  },

  // Filter Toolbar Card
  filterCard: {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
    padding: '18px 20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  filterTitleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterSectionTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#1e293b',
  },
  resetFilterBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    border: '1px solid #cbd5e1',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
 filterGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1.6fr',
    gap: '14px',
    alignItems: 'flex-end',
  },
  filterItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  filterLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#475569',
  },
  searchInputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    padding: '9px 36px 9px 36px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: '#ffffff',
    color: '#0f172a',
  },
  clearSearchBtn: {
    position: 'absolute',
    right: '10px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
  },
  selectInput: {
    width: '100%',
    padding: '9px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    outline: 'none',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    boxSizing: 'border-box',
  },
  dateRangeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  dateInputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    flex: 1,
  },
  dateIcon: {
    position: 'absolute',
    left: '10px',
    pointerEvents: 'none',
  },
  dateInput: {
    width: '100%',
    padding: '9px 10px 9px 32px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '12px',
    outline: 'none',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    boxSizing: 'border-box',
  },

  // Results Bar
  resultsBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 4px',
  },
  resultsText: {
    fontSize: '13px',
    color: '#64748b',
  },
  pageIndicator: {
    fontSize: '12px',
    color: '#94a3b8',
    fontWeight: '500',
  },

  // Main Table Card
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    overflow: 'hidden',
  },
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
    padding: '13px 16px',
    fontSize: '12px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
  },
  tableRow: {
    borderBottom: '1px solid #f1f5f9',
    transition: 'background-color 0.15s',
  },
  td: {
    padding: '12px 16px',
    verticalAlign: 'middle',
  },

  // Fixed Strict Thumbnail Size (52x52px)
  thumbWrapper: {
    width: '52px',
    height: '52px',
    minWidth: '52px',
    minHeight: '52px',
    maxWidth: '52px',
    maxHeight: '52px',
    aspectRatio: '1 / 1',
    borderRadius: '8px',
    backgroundColor: '#f1f5f9',
    overflow: 'hidden',
    cursor: 'pointer',
    flexShrink: 0,
    border: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  thumbPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
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
  bothBadgePill: {
    display: 'inline-block',
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    border: '1px solid #fecaca',
    fontSize: '10px',
    fontWeight: '700',
    padding: '1px 6px',
    borderRadius: '4px',
    marginTop: '3px',
  },

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

  // Pagination Footer
  paginationFooter: {
    padding: '14px 20px',
    backgroundColor: '#f8fafc',
    borderTop: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  paginationInfo: {
    fontSize: '13px',
    color: '#64748b',
  },
  paginationControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  pageBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    color: '#475569',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageNumBtn: {
    minWidth: '32px',
    height: '32px',
    padding: '0 6px',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#ffffff',
    color: '#475569',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  pageNumBtnActive: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    borderColor: '#2563eb',
    fontWeight: '700',
  },
  pageEllipsis: {
    padding: '0 4px',
    color: '#94a3b8',
    fontSize: '13px',
  },

  // Empty & Loading
  loadingArea: {
    padding: '60px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyArea: {
    padding: '60px 20px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  emptyIconCircle: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: '#f0fdf4',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '12px',
  },
  emptyTitle: {
    margin: '0 0 6px 0',
    fontSize: '16px',
    fontWeight: '700',
    color: '#1e293b',
  },
  emptyDesc: {
    margin: 0,
    fontSize: '13px',
    color: '#64748b',
    maxWidth: '400px',
    lineHeight: '1.5',
  },
  emptyResetBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '16px',
    padding: '8px 16px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },

  // Modal Styles (Strict locked 320px image height)
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
  openTabLink: {
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

export default EventHistory;