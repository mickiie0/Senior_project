import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/mainlayout/MainLayout';

import DashboardGlobalStyles from '../components/dashboard/DashboardGlobalStyles';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import StatusBanner from '../components/dashboard/StatusBanner';
import StatsCards from '../components/dashboard/StatsCards';
import DetectionsFeed from '../components/dashboard/DetectionsFeed';
import AnalyticsWidget from '../components/dashboard/AnalyticsWidget';
import CameraStatusWidget from '../components/dashboard/CameraStatusWidget';
import EventDetailModal from '../components/dashboard/EventDetailModal';

import styles from '../components/dashboard/DashboardStyles';
import {
  API_BASE_URL,
  POLL_INTERVAL_MS,
  getAuthHeaders,
  getSSEUrl,
  isCameraOnline,
  isAuthError,
  parseEventDetections,
} from '../components/dashboard/DashboardHelpers';

// Alert stays active for this long after the most recent fire/smoke event
const ALERT_ACTIVE_WINDOW_MS = 5 * 60 * 1000; // 5 นาที ปรับได้ตามต้องการ

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
  const [sseStatus, setSseStatus] = useState('connecting'); // 'connecting' | 'connected' | 'disconnected'

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

  const fetchDashboardData = useCallback(
    async (isManual = false) => {
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
    },
    [handleSessionExpired]
  );

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => fetchDashboardData(false), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Server-Sent Events (SSE) Real-time Stream
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    let eventSource = null;
    try {
      const sseUrl = getSSEUrl();
      eventSource = new EventSource(sseUrl);

      eventSource.addEventListener('connected', () => {
        if (isMountedRef.current) {
          setSseStatus('connected');
        }
      });

      eventSource.addEventListener('new_detection', (e) => {
        try {
          const newEvent = JSON.parse(e.data);
          if (isMountedRef.current && newEvent?.event_id) {
            setRecentDetections((prev) => {
              if (prev.some((item) => item.event_id === newEvent.event_id)) {
                return prev;
              }
              return [newEvent, ...prev];
            });
            setLastUpdated(new Date());
          }
        } catch (err) {
          console.error('Error parsing SSE new_detection event:', err);
        }
      });

      eventSource.onopen = () => {
        if (isMountedRef.current) {
          setSseStatus('connected');
        }
      };

      eventSource.onerror = () => {
        if (isMountedRef.current) {
          setSseStatus('disconnected');
        }
      };
    } catch (err) {
      console.error('Failed to initialize SSE EventSource:', err);
      if (isMountedRef.current) {
        setSseStatus('disconnected');
      }
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

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
  const { totalFireDetections, totalSmokeDetections, eventsWithFire, eventsWithSmoke, avgConfidence } =
    useMemo(() => {
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

  // Latest fire-or-smoke event across all detections (not just "today")
  const latestAlertEvent = useMemo(() => {
    return (
      [...recentDetections]
        .filter((d) => {
          const p = parseEventDetections(d);
          return p.hasFire || p.hasSmoke;
        })
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] || null
    );
  }, [recentDetections]);

  // True only while the latest fire/smoke event is within the active window
  const hasActiveFireAlert = useMemo(() => {
    if (!latestAlertEvent?.created_at) return false;
    const elapsed = Date.now() - new Date(latestAlertEvent.created_at).getTime();
    return elapsed <= ALERT_ACTIVE_WINDOW_MS;
  }, [latestAlertEvent]);

  // AI confidence scores are only shown to admin users
  const isAdmin = user?.role?.toLowerCase() === 'admin';

  return (
    <MainLayout
      title="Fire Detection Dashboard"
      username={user?.username || 'User'}
      userRole={user?.role || 'user'}
    >
      <DashboardGlobalStyles />

      <div style={styles.page}>
        <DashboardHeader
          lastUpdated={lastUpdated}
          isRefreshing={isRefreshing}
          onRefresh={() => fetchDashboardData(true)}
          sseStatus={sseStatus}
        />

        <StatusBanner
          hasActiveFireAlert={hasActiveFireAlert}
          latestAlertEvent={latestAlertEvent}
          camerasMap={camerasMap}
          onViewEvent={setSelectedEvent}
        />

        <StatsCards
          totalCameras={totalCameras}
          activeCameras={activeCameras}
          maintenanceCameras={maintenanceCameras}
          inactiveCameras={inactiveCameras}
          cameraOnlinePercent={cameraOnlinePercent}
          todayDetectionsCount={todayDetections.length}
          fireTodayCount={fireTodayCount}
          smokeTodayCount={smokeTodayCount}
          hasActiveFireAlert={hasActiveFireAlert}
        />

        <div style={styles.splitGrid}>
          <DetectionsFeed
            loading={loading}
            filteredDetections={filteredDetections}
            recentDetections={recentDetections}
            camerasMap={camerasMap}
            filterType={filterType}
            onFilterChange={setFilterType}
            eventsWithFire={eventsWithFire}
            eventsWithSmoke={eventsWithSmoke}
            onViewEvent={setSelectedEvent}
            isAdmin={isAdmin}
          />

          <div style={styles.rightColumn}>
            <AnalyticsWidget
              totalFireDetections={totalFireDetections}
              totalSmokeDetections={totalSmokeDetections}
              recentDetectionsCount={recentDetections.length}
              avgConfidence={avgConfidence}
              isAdmin={isAdmin}
            />
            <CameraStatusWidget cameras={cameras} totalCameras={totalCameras} />
          </div>
        </div>

        <EventDetailModal
          selectedEvent={selectedEvent}
          camerasMap={camerasMap}
          onClose={() => setSelectedEvent(null)}
          isAdmin={isAdmin}
        />
      </div>
    </MainLayout>
  );
};

export default Dashboard;