import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import MainLayout from '../components/mainlayout/MainLayout';

import SnapshotsHeader from '../components/snapshots/SnapshotsHeader';
import SnapshotFilterToolbar from '../components/snapshots/SnapshotFilterToolbar';
import SnapshotsTable from '../components/snapshots/SnapshotsTable';
import SnapshotPreviewModal from '../components/snapshots/SnapshotPreviewModal';

import styles from '../components/snapshots/SnapshotStyles';
import {
  API_BASE_URL,
  ITEMS_PER_PAGE,
  getAuthHeaders,
  exportSnapshotsToCSV,
} from '../components/snapshots/SnapshotHelpers';

const Snapshots = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [cameraFilter, setCameraFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedSnapshot, setSelectedSnapshot] = useState(null);

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
    const fetchInitData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }

      try {
        const [userRes, camRes] = await Promise.allSettled([
          axios.get(`${API_BASE_URL}/me`, getAuthHeaders()),
          axios.get(`${API_BASE_URL}/cameras`, getAuthHeaders()),
        ]);

        if (userRes.status === 'rejected' && userRes.reason?.response?.status === 401) {
          handleSessionExpired();
          return;
        }

        if (!isMountedRef.current) return;

        if (userRes.status === 'fulfilled') setUser(userRes.value.data);
        if (camRes.status === 'fulfilled') setCameras(camRes.value.data || []);
      } catch (err) {
        console.error('Error fetching init data:', err);
      }
    };

    fetchInitData();
  }, [navigate, handleSessionExpired]);

  const fetchSnapshots = useCallback(
    async (isManual = false) => {
      const token = localStorage.getItem('token');
      if (!token) return;

      if (isManual) setIsRefreshing(true);
      setLoading(true);

      try {
        const params = {
          page: currentPage,
          limit: ITEMS_PER_PAGE,
        };

        if (cameraFilter !== 'all') {
          params.camera_id = cameraFilter;
        }
        if (startDate) {
          params.from_date = startDate;
        }
        if (endDate) {
          params.to_date = endDate;
        }

        const res = await axios.get(`${API_BASE_URL}/snapshots`, {
          ...getAuthHeaders(),
          params,
        });

        if (!isMountedRef.current) return;

        setSnapshots(res.data?.items || []);
        setTotalItems(res.data?.total_items || 0);
        setTotalPages(res.data?.total_pages || 1);
      } catch (err) {
        console.error('Error fetching snapshots:', err);
        if (err.response?.status === 401) {
          handleSessionExpired();
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
          if (isManual) setIsRefreshing(false);
        }
      }
    },
    [currentPage, cameraFilter, startDate, endDate, handleSessionExpired]
  );

  useEffect(() => {
    fetchSnapshots();
  }, [fetchSnapshots]);

  useEffect(() => {
    setCurrentPage(1);
  }, [cameraFilter, startDate, endDate]);

  const camerasMap = useMemo(() => {
    const map = {};
    cameras.forEach((c) => {
      const id = c.camera_id || c.id;
      map[id] = c;
    });
    return map;
  }, [cameras]);

  const filteredSnapshots = useMemo(() => {
    if (!searchTerm.trim()) return snapshots;
    const term = searchTerm.toLowerCase();

    return snapshots.filter((snp) => {
      const idMatch = snp.id?.toLowerCase().includes(term);
      const camMatch = snp.camera_id?.toLowerCase().includes(term);
      const cam = camerasMap[snp.camera_id];
      const locMatch =
        cam?.location?.toLowerCase().includes(term) ||
        cam?.sub_location?.toLowerCase().includes(term);

      return idMatch || camMatch || locMatch;
    });
  }, [snapshots, searchTerm, camerasMap]);

  const handleDeleteSnapshot = async (id) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบ Snapshot: ${id}?`)) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/snapshots/${id}`, getAuthHeaders());
      fetchSnapshots(true);
    } catch (err) {
      alert(err.response?.data?.error || 'เกิดข้อผิดพลาด ไม่สามารถลบรูปได้');
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setCameraFilter('all');
    setStartDate('');
    setEndDate('');
  };

  const isAdmin = user?.role?.toLowerCase() === 'admin';

  return (
    <MainLayout
      title="Camera Snapshots"
      username={user?.username || 'User'}
      userRole={user?.role || 'user'}
    >
      <div style={styles.page}>
        <SnapshotsHeader
          isRefreshing={isRefreshing}
          onRefresh={() => fetchSnapshots(true)}
          onExportCSV={() => exportSnapshotsToCSV(filteredSnapshots, camerasMap)}
        />

        {!isAdmin && user ? (
          <div
            style={{
              padding: '40px 20px',
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #fecaca',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <ShieldAlert size={48} color="#ef4444" />
            <h2 style={{ margin: 0, fontSize: '18px', color: '#991b1b', fontWeight: '700' }}>
              ไม่มีสิทธิ์เข้าถึงหน้านี้
            </h2>
            <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
              ส่วนนี้สงวนสิทธิ์เฉพาะผู้ดูแลระบบ (Admin) สำหรับตรวจสอบภาพ Negative Samples เพื่อนำไป Retrain Model เท่านั้น
            </p>
          </div>
        ) : (
          <>
            <SnapshotFilterToolbar
              searchTerm={searchTerm}
              onSearchTermChange={setSearchTerm}
              cameraFilter={cameraFilter}
              onCameraFilterChange={setCameraFilter}
              startDate={startDate}
              onStartDateChange={setStartDate}
              endDate={endDate}
              onEndDateChange={setEndDate}
              cameras={cameras}
              onResetFilters={handleResetFilters}
            />

            <SnapshotsTable
              loading={loading}
              snapshots={filteredSnapshots}
              totalItems={totalItems}
              camerasMap={camerasMap}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              onSelectSnapshot={setSelectedSnapshot}
              onDeleteSnapshot={handleDeleteSnapshot}
              onResetFilters={handleResetFilters}
            />

            <SnapshotPreviewModal
              snapshot={selectedSnapshot}
              camerasMap={camerasMap}
              onClose={() => setSelectedSnapshot(null)}
            />
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default Snapshots;
