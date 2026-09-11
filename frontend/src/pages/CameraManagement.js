import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';

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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [hoveredCard, setHoveredCard] = useState(null);
  const [editingCamera, setEditingCamera] = useState(null);

  const [isTestingIP, setIsTestingIP] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [createData, setCreateData] = useState({
    ip_address: '',
    sub_location: '',
    location: '',
  });

  const fetchCameras = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/cameras`, getAuthHeaders());
      setCameras(res.data || []);
    } catch (err) {
      console.error('Failed to fetch cameras', err);
    }
  }, []);

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
        setUser(userRes.data);
        await fetchCameras();
      } catch (err) {
        localStorage.removeItem('token');
        navigate('/');
      }
    };

    initialize();
  }, [navigate, fetchCameras]);

  const handleTestConnection = async () => {
    if (!createData.ip_address) {
      alert('กรุณากรอก IP Address ก่อนทดสอบ');
      return;
    }

    setIsTestingIP(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/cameras/test-ip`,
        { ip_address: createData.ip_address },
        getAuthHeaders()
      );

      if (res.data.online) {
        alert(`🟢 เชื่อมต่อกล้อง (${createData.ip_address}) สำเร็จ!`);
      } else {
        alert(`🔴 ไม่สามารถเชื่อมต่อกับกล้อง (${createData.ip_address}) ได้`);
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการทดสอบการเชื่อมต่อ');
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
      await fetchCameras();
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการเพิ่มกล้อง');
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
      alert('เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ที่จะลบกล้องตัวนี้?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/cameras/${id}`, getAuthHeaders());
      fetchCameras();
    } catch (err) {
      alert('ลบกล้องไม่สำเร็จ');
    }
  };

  const totalCount = cameras.length;
  const activeCount = cameras.filter((c) => c.status === CAMERA_STATUS.ACTIVE).length;
  const maintenanceCount = cameras.filter((c) => c.status === CAMERA_STATUS.MAINTENANCE).length;
  const inactiveCount = cameras.filter((c) => c.status === CAMERA_STATUS.INACTIVE).length;

  const filteredCameras = cameras.filter(
    (cam) => selectedFilter === 'all' || cam.status === selectedFilter
  );

  const summaryCards = [
    { key: 'all', label: 'กล้องทั้งหมด', count: totalCount, color: '#2563eb' },
    { key: CAMERA_STATUS.ACTIVE, label: 'ใช้งานปกติ (Active)', count: activeCount, color: '#16a34a' },
    { key: CAMERA_STATUS.MAINTENANCE, label: 'ส่งซ่อม (Maintenance)', count: maintenanceCount, color: '#d97706' },
    { key: CAMERA_STATUS.INACTIVE, label: 'ปิดใช้งาน (Inactive)', count: inactiveCount, color: '#dc2626' },
  ];

  return (
    <MainLayout title="Camera Management" username={user?.username || 'User'} userRole={user?.role || 'admin'}>
      <div style={styles.page}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.headerTitle}>จัดการกล้องวงจรปิด</h2>
          <p style={styles.headerSubtitle}>เพิ่ม แก้ไข และตรวจสอบสถานะของกล้องในระบบ</p>
        </div>

        {/* Summary Grid */}
        <div style={styles.summaryGrid}>
          {summaryCards.map(({ key, label, count, color }) => (
            <div
              key={key}
              onClick={() => setSelectedFilter(key)}
              onMouseEnter={() => setHoveredCard(key)}
              onMouseLeave={() => setHoveredCard(null)}
              style={getCardStyle(color, selectedFilter === key, hoveredCard === key)}
            >
              <span style={styles.cardTitle}>{label}</span>
              <div style={styles.cardNum}>
                {count} <span style={styles.unit}>ตัว</span>
              </div>
            </div>
          ))}
        </div>

        {/* Form Card (จัด Grid ใหม่เป็น 4 คอลัมน์อย่างสมดุล) */}
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>+ เพิ่มกล้องใหม่</h3>
          <form onSubmit={handleCreate} style={styles.formGrid}>
            <div>
              <label style={styles.label}>IP Address</label>
              <input
                type="text"
                placeholder="เช่น 192.168.1.100"
                value={createData.ip_address}
                onChange={(e) => setCreateData({ ...createData, ip_address: e.target.value })}
                required
                disabled={isSubmitting}
                style={styles.input}
              />
            </div>

            <div>
              <label style={styles.label}>Sub Location</label>
              <input
                type="text"
                placeholder="เช่น ชั้น 2 ห้องโถง"
                value={createData.sub_location}
                onChange={(e) => setCreateData({ ...createData, sub_location: e.target.value })}
                required
                disabled={isSubmitting}
                style={styles.input}
              />
            </div>

            <div>
              <label style={styles.label}>Location</label>
              <input
                type="text"
                placeholder="เช่น อาคาร A"
                value={createData.location}
                onChange={(e) => setCreateData({ ...createData, location: e.target.value })}
                required
                disabled={isSubmitting}
                style={styles.input}
              />
            </div>

            {/* Action Group: รวมปุ่มทดสอบและปุ่มบันทึกไว้คอลัมน์เดียวกันอย่างลงตัว */}
            <div style={styles.actionGroup}>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTestingIP || isSubmitting}
                style={{
                  ...styles.btnSecondary,
                  backgroundColor: isTestingIP || isSubmitting ? '#e2e8f0' : '#f1f5f9',
                }}
              >
                {isTestingIP ? 'กำลังทดสอบ' : 'ทดสอบ IP'}
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  ...styles.btnPrimary,
                  backgroundColor: isSubmitting ? '#93c5fd' : '#2563eb',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                }}
              >
                {isSubmitting ? 'กำลังบันทึก' : 'บันทึก'}
              </button>
            </div>
          </form>
        </div>

        {/* Table Card */}
        <div style={styles.tableCard}>
          {selectedFilter !== 'all' && (
            <div style={styles.filterBar}>
              <span style={styles.filterText}>
                กำลังกรองแสดงผลเฉพาะ: <strong>{selectedFilter.toUpperCase()}</strong> ({filteredCameras.length} รายการ)
              </span>
              <button onClick={() => setSelectedFilter('all')} style={styles.filterClearBtn}>
                ล้างการกรองทั้งหมด
              </button>
            </div>
          )}

          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeadRow}>
                <th style={styles.th}>Camera ID</th>
                <th style={styles.th}>IP Address</th>
                <th style={styles.th}>Sub Location</th>
                <th style={styles.th}>Location</th>
                <th style={styles.th}>Status</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCameras.length > 0 ? (
                filteredCameras.map((cam) => (
                  <tr key={cam.camera_id} style={styles.tableRow}>
                    <td style={styles.tdMono}>{cam.camera_id}</td>
                    <td style={styles.tdMonoStrong}>{cam.ip_address || '-'}</td>
                    <td style={styles.tdMedium}>{cam.sub_location}</td>
                    <td style={styles.td}>{cam.location}</td>
                    <td style={styles.td}>
                      <StatusBadge status={cam.status} />
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <button onClick={() => openEditModal(cam)} style={styles.btnEdit}>แก้ไข</button>
                      <button onClick={() => handleDelete(cam.camera_id)} style={styles.btnDelete}>ลบ</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={styles.emptyState}>
                    ไม่พบข้อมูลกล้องตามเงื่อนไขการกรอง
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Edit */}
        {isEditModalOpen && editingCamera && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalBox}>
              <h3 style={styles.modalTitle}>แก้ไขข้อมูลกล้อง</h3>
              <form onSubmit={handleUpdate}>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>IP Address</label>
                  <input
                    type="text"
                    value={editingCamera.ip_address || ''}
                    onChange={(e) => setEditingCamera({ ...editingCamera, ip_address: e.target.value })}
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Sub Location</label>
                  <input
                    type="text"
                    value={editingCamera.sub_location}
                    onChange={(e) => setEditingCamera({ ...editingCamera, sub_location: e.target.value })}
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Location</label>
                  <input
                    type="text"
                    value={editingCamera.location}
                    onChange={(e) => setEditingCamera({ ...editingCamera, location: e.target.value })}
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.fieldGroupLast}>
                  <label style={styles.label}>Status</label>
                  <select
                    value={editingCamera.status}
                    onChange={(e) => setEditingCamera({ ...editingCamera, status: e.target.value })}
                    style={styles.input}
                  >
                    <option value={CAMERA_STATUS.ACTIVE}>Active</option>
                    <option value={CAMERA_STATUS.INACTIVE}>Inactive</option>
                    <option value={CAMERA_STATUS.MAINTENANCE}>Maintenance</option>
                  </select>
                </div>
                <div style={styles.modalActions}>
                  <button type="button" onClick={() => setIsEditModalOpen(false)} style={styles.btnCancel}>ยกเลิก</button>
                  <button type="submit" style={styles.btnPrimary}>อัปเดตข้อมูล</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

const STATUS_BADGE_STYLES = {
  active: { bg: '#dcfce7', color: '#15803d', label: 'Active' },
  inactive: { bg: '#fee2e2', color: '#b91c1c', label: 'Inactive' },
  maintenance: { bg: '#fef3c7', color: '#b45309', label: 'Maintenance' },
};

const StatusBadge = ({ status }) => {
  const current = STATUS_BADGE_STYLES[status] || STATUS_BADGE_STYLES.inactive;
  return (
    <span
      style={{
        backgroundColor: current.bg,
        color: current.color,
        padding: '4px 12px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: '600',
      }}
    >
      {current.label}
    </span>
  );
};

const getCardStyle = (borderColor, isSelected, isHovered) => ({
  backgroundColor: '#fff',
  padding: '16px 20px',
  borderRadius: '12px',
  boxShadow: isSelected
    ? `0 0 0 2px ${borderColor}, 0 4px 6px -1px rgba(0,0,0,0.1)`
    : isHovered
      ? '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)'
      : '0 1px 3px rgba(0,0,0,0.1)',
  borderLeft: `5px solid ${borderColor}`,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  transform: isSelected || isHovered ? 'translateY(-4px)' : 'none',
  userSelect: 'none',
});

const styles = {
  page: { padding: '8px' },

  header: { marginBottom: '24px' },
  headerTitle: { fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: 0 },
  headerSubtitle: { color: '#64748b', fontSize: '14px', marginTop: '4px' },

  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  cardTitle: { fontSize: '13px', color: '#64748b', fontWeight: '500' },
  cardNum: { fontSize: '24px', fontWeight: 'bold', color: '#1e293b', marginTop: '4px' },
  unit: { fontSize: '13px', fontWeight: 'normal', color: '#64748b' },

  formCard: {
    backgroundColor: '#fff',
    padding: '20px 24px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginBottom: '24px',
  },
  formTitle: { fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#334155' },

  // Grid ปรับให้สมดุล 4 ช่องเท่าๆ กัน
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    alignItems: 'end',
  },

  actionGroup: {
    display: 'flex',
    gap: '8px',
  },

  label: { display: 'block', fontSize: '13px', fontWeight: '500', color: '#475569', marginBottom: '6px' },
  input: {
    padding: '10px 14px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    height: '40px',
  },

  btnPrimary: {
    backgroundColor: '#2563eb',
    color: '#fff',
    border: 'none',
    padding: '0 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500',
    height: '40px',
    flex: 1,
    whiteSpace: 'nowrap',
  },
  btnSecondary: {
    color: '#334155',
    border: '1px solid #cbd5e1',
    padding: '0 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500',
    height: '40px',
    fontSize: '13px',
    whiteSpace: 'nowrap',
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
  },
  btnEdit: { backgroundColor: '#f1f5f9', color: '#334155', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', marginRight: '8px' },
  btnDelete: { backgroundColor: '#fef2f2', color: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' },
  btnCancel: { backgroundColor: '#e2e8f0', color: '#475569', border: 'none', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer' },

  tableCard: { backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' },
  filterBar: {
    padding: '12px 16px',
    backgroundColor: '#f1f5f9',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterText: { fontSize: '13px', color: '#475569' },
  filterClearBtn: { border: 'none', background: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '13px', fontWeight: '500' },

  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' },
  tableHeadRow: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' },
  th: { padding: '16px' },
  tableRow: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '16px' },
  tdMedium: { padding: '16px', fontWeight: '500' },
  tdMono: { padding: '16px', fontFamily: 'monospace', color: '#64748b' },
  tdMonoStrong: { padding: '16px', fontFamily: 'monospace', fontWeight: '600', color: '#1e293b' },
  emptyState: { padding: '32px', textAlign: 'center', color: '#94a3b8' },

  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalBox: { backgroundColor: '#fff', padding: '24px', borderRadius: '12px', width: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' },
  modalTitle: { marginTop: 0, marginBottom: '16px' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '8px' },
  fieldGroup: { marginBottom: '12px' },
  fieldGroupLast: { marginBottom: '20px' },
};

export default CameraManagement;