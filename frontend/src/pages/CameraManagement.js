import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import {
  Camera,
  Video,
  CheckCircle2,
  AlertTriangle,
  WifiOff,
  Wifi,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Search,
  MapPin,
  RotateCcw,
  X,
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:8080/api';

const CAMERA_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  MAINTENANCE: 'maintenance',
};

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

const CameraManagement = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCamera, setEditingCamera] = useState(null);

  const [isTestingIP, setIsTestingIP] = useState(false);
  const [testResult, setTestResult] = useState(null); // { success: boolean, message: string }
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [createData, setCreateData] = useState({
    ip_address: '',
    sub_location: '',
    location: '',
  });

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

  const fetchCameras = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/cameras`, getAuthHeaders());
      if (isMountedRef.current) {
        setCameras(res.data || []);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        handleSessionExpired();
      } else {
        console.error('Failed to fetch cameras', err);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        if (isManual) setIsRefreshing(false);
      }
    }
  }, [handleSessionExpired]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    const initialize = async () => {
      try {
        const userRes = await axios.get(`${API_BASE_URL}/me`, getAuthHeaders());
        if (userRes.data.role?.toLowerCase() !== 'admin') {
          navigate('/dashboard');
          return;
        }
        if (isMountedRef.current) setUser(userRes.data);
        await fetchCameras();
      } catch (err) {
        handleSessionExpired();
      }
    };

    initialize();
  }, [navigate, fetchCameras, handleSessionExpired]);

  const handleTestConnection = async () => {
    if (!createData.ip_address.trim()) {
      alert('กรุณากรอก IP Address ก่อนทดสอบ');
      return;
    }

    setIsTestingIP(true);
    setTestResult(null);

    try {
      const res = await axios.post(
        `${API_BASE_URL}/cameras/test-ip`,
        { ip_address: createData.ip_address.trim() },
        getAuthHeaders()
      );

      if (res.data.online) {
        setTestResult({
          success: true,
          message: `เชื่อมต่อกับกล้อง (${createData.ip_address}) สำเร็จ (Online)`,
        });
      } else {
        setTestResult({
          success: false,
          message: `ไม่สามารถเชื่อมต่อกับกล้อง (${createData.ip_address}) ได้ (Unreachable)`,
        });
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: 'เกิดข้อผิดพลาดในการทดสอบการเชื่อมต่อ กรุณาตรวจสอบรูปแบบ IP',
      });
    } finally {
      setIsTestingIP(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await axios.post(`${API_BASE_URL}/cameras`, createData, getAuthHeaders());
      setCreateData({ ip_address: '', sub_location: '', location: '' });
      setTestResult(null);
      await fetchCameras();
      alert('เพิ่มกล้องใหม่สำเร็จเรียบร้อย');
    } catch (err) {
      const msg = err.response?.data?.error || 'เกิดข้อผิดพลาดในการเพิ่มกล้อง';
      alert(`ไม่สามารถเพิ่มกล้องได้: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (cam) => {
    setEditingCamera({ ...cam });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `${API_BASE_URL}/cameras/${editingCamera.camera_id}`,
        {
          ip_address: editingCamera.ip_address,
          sub_location: editingCamera.sub_location,
          location: editingCamera.location,
          status: editingCamera.status,
        },
        getAuthHeaders()
      );
      setIsEditModalOpen(false);
      fetchCameras();
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการอัปเดตข้อมูลกล้อง');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ที่จะลบกล้อง ${id} ออกจากระบบ?`)) return;
    try {
      await axios.delete(`${API_BASE_URL}/cameras/${id}`, getAuthHeaders());
      fetchCameras();
    } catch (err) {
      alert('ลบกล้องไม่สำเร็จ เนื่องจากกล้องนี้อาจมีข้อมูลเหตุการณ์เชื่อมโยงอยู่');
    }
  };

  // Metrics
  const totalCount = cameras.length;
  const activeCount = cameras.filter((c) => c.status === CAMERA_STATUS.ACTIVE).length;
  const maintenanceCount = cameras.filter((c) => c.status === CAMERA_STATUS.MAINTENANCE).length;
  const inactiveCount = cameras.filter((c) => c.status === CAMERA_STATUS.INACTIVE).length;
  const uptimePercent = totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0;

  // Filtered cameras
  const filteredCameras = useMemo(() => {
    return cameras.filter((cam) => {
      // 1. Status Filter
      if (selectedFilter !== 'all' && cam.status !== selectedFilter) {
        return false;
      }

      // 2. Search Filter (Camera ID, IP, Location, Sub-location)
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const id = (cam.camera_id || '').toLowerCase();
        const ip = (cam.ip_address || '').toLowerCase();
        const loc = (cam.location || '').toLowerCase();
        const subLoc = (cam.sub_location || '').toLowerCase();

        const match =
          id.includes(q) || ip.includes(q) || loc.includes(q) || subLoc.includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [cameras, selectedFilter, searchTerm]);

  const summaryCards = [
    {
      key: 'all',
      title: 'กล้องทั้งหมดในระบบ',
      count: totalCount,
      sub: 'ลงทะเบียนในระบบทั้งหมด',
      icon: Video,
      color: '#2563eb',
      bgColor: '#eff6ff',
    },
    {
      key: CAMERA_STATUS.ACTIVE,
      title: 'พร้อมใช้งาน (Active)',
      count: activeCount,
      sub: `ความพร้อมใช้งาน ${uptimePercent}%`,
      icon: CheckCircle2,
      color: '#16a34a',
      bgColor: '#f0fdf4',
    },
    {
      key: CAMERA_STATUS.MAINTENANCE,
      title: 'ส่งซ่อมบำรุง (Maintenance)',
      count: maintenanceCount,
      sub: 'อยู่ระหว่างตรวจสอบ/ซ่อม',
      icon: AlertTriangle,
      color: '#d97706',
      bgColor: '#fef3c7',
    },
    {
      key: CAMERA_STATUS.INACTIVE,
      title: 'ปิดใช้งาน (Inactive)',
      count: inactiveCount,
      sub: 'ออฟไลน์หรือถูกปิดการทำงาน',
      icon: WifiOff,
      color: '#dc2626',
      bgColor: '#fee2e2',
    },
  ];

  return (
    <MainLayout
      title="Camera Management"
      username={user?.username || 'User'}
      userRole={user?.role || 'admin'}
    >
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin-icon {
          animation: spin 0.8s linear infinite;
        }
        .dash-card:hover {
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.07), 0 4px 6px -2px rgba(0, 0, 0, 0.03);
          transition: all 0.2s ease-in-out;
        }
        .interactive-row:hover {
          background-color: #f8fafc !important;
        }
        .cam-input:focus {
          border-color: #2563eb !important;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1) !important;
        }
      `}</style>

      <div style={styles.page}>
        {/* Top Header */}
        <div style={styles.headerBar}>
          <div>
            <h1 style={styles.headerTitle}>จัดการกล้องวงจรปิด</h1>
            <p style={styles.headerSubtitle}>
              เพิ่ม แก้ไข ตรวจสอบการเชื่อมต่อเครือข่าย และสถานะการทำงานของกล้องในระบบ
            </p>
          </div>

          <div style={styles.headerActions}>
            <button
              onClick={() => fetchCameras(true)}
              disabled={isRefreshing}
              style={styles.refreshBtn}
              title="กดเพื่อรีเฟรชข้อมูลล่าสุด"
            >
              <RefreshCw size={15} className={isRefreshing ? 'spin-icon' : ''} />
              <span>รีเฟรช</span>
            </button>
          </div>
        </div>

        {/* 4 KPI Summary Cards (Unified Style with Dashboard & Events) */}
        <div style={styles.statsGrid}>
          {summaryCards.map(({ key, title, count, sub, icon: Icon, color, bgColor }) => {
            const isSelected = selectedFilter === key;

            return (
              <div
                key={key}
                onClick={() => setSelectedFilter(key)}
                style={{
                  ...styles.statCard,
                  ...(isSelected ? { borderColor: color, boxShadow: `0 0 0 2px ${color}` } : {}),
                }}
                className="dash-card"
              >
                <div style={styles.statCardHeader}>
                  <span style={styles.statCardTitle}>{title}</span>
                  <div style={{ ...styles.statIconBadge, backgroundColor: bgColor, color }}>
                    <Icon size={18} />
                  </div>
                </div>
                <div style={{ ...styles.statCardValue, color }}>
                  {count} <span style={styles.statCardUnit}>ตัว</span>
                </div>
                <div style={styles.statCardSubText}>{sub}</div>
              </div>
            );
          })}
        </div>

        {/* Form Card: Add New Camera */}
        <div style={styles.formCard} className="dash-card">
          <div style={styles.formCardHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={styles.formIconWrapper}>
                <Plus size={16} color="#2563eb" />
              </div>
              <h3 style={styles.formTitle}>เพิ่มกล้องวงจรปิดใหม่เข้าสู่ระบบ</h3>
            </div>
          </div>

          <form onSubmit={handleCreate} style={styles.formContent}>
            <div style={styles.formGrid}>
              {/* IP Address */}
              <div style={styles.fieldItem}>
                <label style={styles.label}>IP Address ของกล้อง</label>
                <div style={styles.inputWrapper}>
                  <Wifi size={15} color="#94a3b8" style={styles.inputIcon} />
                  <input
                    type="text"
                    placeholder="เช่น 192.168.1.100"
                    value={createData.ip_address}
                    onChange={(e) =>
                      setCreateData({ ...createData, ip_address: e.target.value })
                    }
                    required
                    disabled={isSubmitting}
                    style={styles.inputWithIcon}
                    className="cam-input"
                  />
                </div>
              </div>

              {/* Location (Building) */}
              <div style={styles.fieldItem}>
                <label style={styles.label}>อาคาร / บริเวณ (Location)</label>
                <div style={styles.inputWrapper}>
                  <MapPin size={15} color="#94a3b8" style={styles.inputIcon} />
                  <input
                    type="text"
                    placeholder="เช่น อาคาร A"
                    value={createData.location}
                    onChange={(e) =>
                      setCreateData({ ...createData, location: e.target.value })
                    }
                    required
                    disabled={isSubmitting}
                    style={styles.inputWithIcon}
                    className="cam-input"
                  />
                </div>
              </div>

              {/* Sub Location */}
              <div style={styles.fieldItem}>
                <label style={styles.label}>จุดติดตั้งย่อย (Sub Location)</label>
                <div style={styles.inputWrapper}>
                  <MapPin size={15} color="#94a3b8" style={styles.inputIcon} />
                  <input
                    type="text"
                    placeholder="เช่น ชั้น 2 ห้องโถง"
                    value={createData.sub_location}
                    onChange={(e) =>
                      setCreateData({ ...createData, sub_location: e.target.value })
                    }
                    required
                    disabled={isSubmitting}
                    style={styles.inputWithIcon}
                    className="cam-input"
                  />
                </div>
              </div>

              {/* Actions: Test IP & Submit */}
              <div style={styles.actionCol}>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTestingIP || isSubmitting}
                  style={styles.btnSecondary}
                  title="ทดสอบ Ping การเชื่อมต่อเครือข่าย"
                >
                  <Wifi size={14} className={isTestingIP ? 'spin-icon' : ''} />
                  <span>{isTestingIP ? 'กำลังทดสอบ...' : 'ทดสอบ IP'}</span>
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={styles.btnPrimary}
                >
                  <Plus size={15} />
                  <span>{isSubmitting ? 'กำลังบันทึก...' : 'บันทึกกล้อง'}</span>
                </button>
              </div>
            </div>

            {/* IP Test Feedback Banner */}
            {testResult && (
              <div
                style={{
                  ...styles.testResultBox,
                  backgroundColor: testResult.success ? '#f0fdf4' : '#fef2f2',
                  borderColor: testResult.success ? '#bbf7d0' : '#fecaca',
                  color: testResult.success ? '#166534' : '#991b1b',
                }}
              >
                {testResult.success ? (
                  <CheckCircle2 size={16} color="#16a34a" />
                ) : (
                  <AlertTriangle size={16} color="#dc2626" />
                )}
                <span>{testResult.message}</span>
                <button
                  type="button"
                  onClick={() => setTestResult(null)}
                  style={styles.closeTestResultBtn}
                >
                  <X size={13} />
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Search & Filter Toolbar */}
        <div style={styles.filterCard}>
          <div style={styles.filterLeft}>
            <div style={styles.searchInputWrapper}>
              <Search size={15} color="#94a3b8" style={styles.searchIcon} />
              <input
                type="text"
                placeholder="ค้นหาด้วยรหัสกล้อง, IP Address, สถานที่"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
                className="cam-input"
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

            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              style={styles.filterSelect}
              className="cam-input"
            >
              <option value="all">สถานะทั้งหมด ({totalCount})</option>
              <option value={CAMERA_STATUS.ACTIVE}>เฉพาะพร้อมใช้งาน ({activeCount})</option>
              <option value={CAMERA_STATUS.MAINTENANCE}>เฉพาะส่งซ่อม ({maintenanceCount})</option>
              <option value={CAMERA_STATUS.INACTIVE}>เฉพาะปิดใช้งาน ({inactiveCount})</option>
            </select>
          </div>

          {(searchTerm || selectedFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedFilter('all');
              }}
              style={styles.resetFilterBtn}
            >
              <RotateCcw size={13} />
              <span>ล้างตัวกรอง</span>
            </button>
          )}
        </div>

        {/* Main Table Card */}
        <div style={styles.tableCard}>
          {loading ? (
            <div style={styles.loadingArea}>
              <RefreshCw size={28} className="spin-icon" color="#2563eb" />
              <p style={{ marginTop: '12px', color: '#64748b', fontSize: '14px' }}>
                กำลังเชื่อมต่อและโหลดข้อมูลกล้อง...
              </p>
            </div>
          ) : filteredCameras.length === 0 ? (
            <div style={styles.emptyArea}>
              <div style={styles.emptyIconCircle}>
                <Camera size={36} color="#94a3b8" />
              </div>
              <h3 style={styles.emptyTitle}>ไม่พบข้อมูลกล้องตามเงื่อนไข</h3>
              <p style={styles.emptyDesc}>
                {cameras.length === 0
                  ? 'ยังไม่มีกล้องที่ลงทะเบียนไว้ในระบบ สามารถเพิ่มกล้องใหม่ได้จากฟอร์มด้านบน'
                  : 'กรุณาลองปรับเปลี่ยนคำค้นหา หรือกดปุ่ม "ล้างตัวกรอง" เพื่อแสดงรายการกล้องทั้งหมด'}
              </p>
            </div>
          ) : (
            <div style={styles.tableScroll}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeadRow}>
                    <th style={styles.th}>Camera ID</th>
                    <th style={styles.th}>IP Address</th>
                    <th style={styles.th}>ตำแหน่งที่ติดตั้ง (Location)</th>
                    <th style={styles.th}>สถานะ (Status)</th>
                    <th style={{ ...styles.th, textAlign: 'center' }}>การจัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCameras.map((cam) => (
                    <tr
                      key={cam.camera_id}
                      style={styles.tableRow}
                      className="interactive-row"
                    >
                      {/* Camera ID */}
                      <td style={styles.td}>
                        <div style={styles.camIdBadge}>
                          <Camera size={13} color="#2563eb" />
                          <span>{cam.camera_id}</span>
                        </div>
                      </td>

                      {/* IP Address */}
                      <td style={styles.td}>
                        <div style={styles.ipBadge}>
                          <Wifi
                            size={13}
                            color={cam.status === CAMERA_STATUS.ACTIVE ? '#16a34a' : '#94a3b8'}
                          />
                          <span style={styles.ipText}>{cam.ip_address || '-'}</span>
                        </div>
                      </td>

                      {/* Location & Sub Location */}
                      <td style={styles.td}>
                        <div style={styles.locationBlock}>
                          <div style={styles.locationMain}>
                            <MapPin size={13} color="#475569" />
                            <span>{cam.location}</span>
                          </div>
                          <div style={styles.subLocationText}>{cam.sub_location}</div>
                        </div>
                      </td>

                      {/* Status */}
                      <td style={styles.td}>
                        <StatusBadge status={cam.status} />
                      </td>

                      {/* Actions */}
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        <div style={styles.actionButtonsRow}>
                          <button
                            onClick={() => openEditModal(cam)}
                            style={styles.btnEdit}
                            title="แก้ไขข้อมูลกล้อง"
                          >
                            <Edit2 size={13} />
                            <span>แก้ไข</span>
                          </button>
                          <button
                            onClick={() => handleDelete(cam.camera_id)}
                            style={styles.btnDelete}
                            title="ลบกล้องออกจากระบบ"
                          >
                            <Trash2 size={13} />
                            <span>ลบ</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Footer */}
          <div style={styles.cardFooter}>
            <span style={styles.cardFooterNote}>
              แสดงผล <strong>{filteredCameras.length}</strong> จากทั้งหมด {cameras.length} กล้อง
            </span>
          </div>
        </div>

        {/* Modal: Edit Camera Details (Unified with Snapshot Modal styling) */}
        {isEditModalOpen && editingCamera && (
          <div style={styles.modalBackdrop} onClick={() => setIsEditModalOpen(false)}>
            <div style={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div style={styles.modalHeader}>
                <div style={styles.modalHeaderTitleRow}>
                  <Camera size={20} color="#2563eb" />
                  <div>
                    <h3 style={styles.modalTitle}>
                      แก้ไขข้อมูลกล้อง {editingCamera.camera_id}
                    </h3>
                    <div style={styles.modalSubtitle}>
                      ปรับปรุง IP Address สถานที่ติดตั้ง หรือเปลี่ยนสถานะการทำงาน
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  style={styles.modalCloseBtn}
                  title="ปิดหน้าต่าง"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleUpdate}>
                <div style={styles.modalBody}>
                  <div style={styles.modalFieldGroup}>
                    <label style={styles.label}>IP Address</label>
                    <input
                      type="text"
                      value={editingCamera.ip_address || ''}
                      onChange={(e) =>
                        setEditingCamera({ ...editingCamera, ip_address: e.target.value })
                      }
                      style={styles.input}
                      className="cam-input"
                      required
                    />
                  </div>

                  <div style={styles.modalFieldGroup}>
                    <label style={styles.label}>อาคาร / บริเวณ (Location)</label>
                    <input
                      type="text"
                      value={editingCamera.location}
                      onChange={(e) =>
                        setEditingCamera({ ...editingCamera, location: e.target.value })
                      }
                      style={styles.input}
                      className="cam-input"
                      required
                    />
                  </div>

                  <div style={styles.modalFieldGroup}>
                    <label style={styles.label}>จุดติดตั้งย่อย (Sub Location)</label>
                    <input
                      type="text"
                      value={editingCamera.sub_location}
                      onChange={(e) =>
                        setEditingCamera({ ...editingCamera, sub_location: e.target.value })
                      }
                      style={styles.input}
                      className="cam-input"
                      required
                    />
                  </div>

                  <div style={styles.modalFieldGroup}>
                    <label style={styles.label}>สถานะการทำงาน (Status)</label>
                    <select
                      value={editingCamera.status}
                      onChange={(e) =>
                        setEditingCamera({ ...editingCamera, status: e.target.value })
                      }
                      style={styles.input}
                      className="cam-input"
                    >
                      <option value={CAMERA_STATUS.ACTIVE}>Active</option>
                      <option value={CAMERA_STATUS.MAINTENANCE}>Maintenance</option>
                      <option value={CAMERA_STATUS.INACTIVE}>Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Modal Footer */}
                <div style={styles.modalFooter}>
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    style={styles.modalCancelBtn}
                  >
                    ยกเลิก
                  </button>
                  <button type="submit" style={styles.modalSubmitBtn}>
                    บันทึกการแก้ไข
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

// Unified Status Badge Component
const STATUS_BADGE_CONFIG = {
  active: {
    bg: '#dcfce7',
    color: '#15803d',
    border: '#bbf7d0',
    dotColor: '#16a34a',
    label: 'Active',
  },
  inactive: {
    bg: '#fee2e2',
    color: '#b91c1c',
    border: '#fecaca',
    dotColor: '#dc2626',
    label: 'Inactive',
  },
  maintenance: {
    bg: '#fef3c7',
    color: '#b45309',
    border: '#fde68a',
    dotColor: '#f59e0b',
    label: 'Maintenance',
  },
};

const StatusBadge = ({ status }) => {
  const current = STATUS_BADGE_CONFIG[status] || STATUS_BADGE_CONFIG.inactive;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: current.bg,
        color: current.color,
        border: `1px solid ${current.border}`,
        padding: '3px 10px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: '600',
        letterSpacing: '0.2px',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: current.dotColor,
        }}
      />
      {current.label}
    </span>
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

  // 4 KPI Summary Cards
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
    cursor: 'pointer',
    transition: 'all 0.2s ease',
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
    marginTop: '10px',
    letterSpacing: '-0.5px',
    display: 'flex',
    alignItems: 'baseline',
    gap: '6px',
  },
  statCardUnit: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#64748b',
  },
  statCardSubText: {
    fontSize: '12px',
    color: '#64748b',
    marginTop: '6px',
  },

  // Add Camera Form Card
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    overflow: 'hidden',
  },
  formCardHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid #f1f5f9',
    backgroundColor: '#ffffff',
  },
  formIconWrapper: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    backgroundColor: '#eff6ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formTitle: {
    margin: 0,
    fontSize: '15px',
    fontWeight: '700',
    color: '#0f172a',
  },
  formContent: {
    padding: '20px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
    alignItems: 'end',
  },
  fieldItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#475569',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    pointerEvents: 'none',
  },
  inputWithIcon: {
    width: '100%',
    padding: '10px 12px 10px 36px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: '#ffffff',
    color: '#0f172a',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: '#ffffff',
    color: '#0f172a',
  },
  actionCol: {
    display: 'flex',
    gap: '8px',
  },
  btnPrimary: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    height: '38px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s',
  },
  btnSecondary: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    height: '38px',
    backgroundColor: '#ffffff',
    color: '#334155',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s',
  },
  testResultBox: {
    marginTop: '16px',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid',
    fontSize: '13px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  closeTestResultBtn: {
    marginLeft: 'auto',
    border: 'none',
    backgroundColor: 'transparent',
    color: 'inherit',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },

  // Filter Toolbar
  filterCard: {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
    padding: '14px 20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  filterLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
    flexWrap: 'wrap',
  },
  searchInputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    minWidth: '280px',
    flex: 1,
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    padding: '9px 36px',
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
  filterSelect: {
    padding: '9px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    outline: 'none',
    backgroundColor: '#ffffff',
    color: '#0f172a',
  },
  resetFilterBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    border: '1px solid #cbd5e1',
    padding: '7px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },

  // Table Card
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
    padding: '14px 18px',
    fontSize: '12px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
  },
  tableRow: {
    borderBottom: '1px solid #f1f5f9',
    transition: 'background-color 0.15s',
  },
  td: {
    padding: '14px 18px',
    verticalAlign: 'middle',
  },
  camIdBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontFamily: 'monospace',
    fontWeight: '700',
    color: '#1e293b',
    backgroundColor: '#f1f5f9',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '13px',
  },
  ipBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  ipText: {
    fontFamily: 'monospace',
    fontSize: '13px',
    color: '#334155',
    fontWeight: '500',
  },
  locationBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  locationMain: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontWeight: '600',
    color: '#1e293b',
    fontSize: '13px',
  },
  subLocationText: {
    fontSize: '12px',
    color: '#64748b',
    paddingLeft: '18px',
  },
  actionButtonsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  btnEdit: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 12px',
    backgroundColor: '#f1f5f9',
    color: '#334155',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  btnDelete: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 12px',
    backgroundColor: '#fef2f2',
    color: '#ef4444',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  cardFooter: {
    padding: '14px 20px',
    backgroundColor: '#f8fafc',
    borderTop: '1px solid #f1f5f9',
    fontSize: '13px',
  },
  cardFooterNote: {
    color: '#64748b',
    fontSize: '12px',
  },

  // Loading & Empty States
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
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
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
    maxWidth: '520px',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
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
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  modalFieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  modalFooter: {
    padding: '16px 24px',
    borderTop: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
  },
  modalCancelBtn: {
    padding: '8px 18px',
    backgroundColor: '#ffffff',
    color: '#475569',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  modalSubmitBtn: {
    padding: '8px 20px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
  },
};

export default CameraManagement;