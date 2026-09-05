import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';

const CameraManagement = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // State สำหรับการกรองสถานะ ('all', 'active', 'maintenance', 'inactive')
  const [selectedFilter, setSelectedFilter] = useState('all');
  
  // State สำหรับ Hover Effect
  const [hoveredCard, setHoveredCard] = useState(null);

  const [createData, setCreateData] = useState({
    sub_location: '',
    location: '',
    status: 'active',
  });

  const [editingCamera, setEditingCamera] = useState(null);

  const fetchCameras = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get('http://localhost:8080/api/cameras', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCameras(res.data || []);
    } catch (err) {
      console.error('Failed to fetch cameras', err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');

    const fetchCamerasData = async (headers) => {
      try {
        const res = await axios.get('http://localhost:8080/api/cameras', headers);
        setCameras(res.data || []);
      } catch (err) {
        console.error('Failed to fetch cameras', err);
      }
    };

    const fetchData = async () => {
      if (!token) {
        navigate('/');
        return;
      }

      const authHeader = { headers: { Authorization: `Bearer ${token}` } };

      try {
        const userRes = await axios.get('http://localhost:8080/api/me', authHeader);
        if (userRes.data.role?.toLowerCase() !== 'admin') {
          navigate('/dashboard');
          return;
        }
        setUser(userRes.data);
        await fetchCamerasData(authHeader);
      } catch (err) {
        localStorage.removeItem('token');
        navigate('/');
      }
    };

    fetchData();
  }, [navigate]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      await axios.post('http://localhost:8080/api/cameras', createData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCreateData({ sub_location: '', location: '', status: 'active' });
      fetchCameras();
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการเพิ่มกล้อง');
    }
  };

  const openEditModal = (cam) => {
    setEditingCamera({ ...cam });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      await axios.put(
        `http://localhost:8080/api/cameras/${editingCamera.camera_id}`,
        {
          sub_location: editingCamera.sub_location,
          location: editingCamera.location,
          status: editingCamera.status,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setIsEditModalOpen(false);
      fetchCameras();
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ที่จะลบกล้องตัวนี้?')) return;
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`http://localhost:8080/api/cameras/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCameras();
    } catch (err) {
      alert('ลบกล้องไม่สำเร็จ');
    }
  };

  // คำนวณจำนวนกล้อง
  const totalCount = cameras.length;
  const activeCount = cameras.filter((c) => c.status === 'active').length;
  const maintenanceCount = cameras.filter((c) => c.status === 'maintenance').length;
  const inactiveCount = cameras.filter((c) => c.status === 'inactive').length;

  // กรองข้อมูลกล้อง
  const filteredCameras = cameras.filter((cam) => {
    if (selectedFilter === 'all') return true;
    return cam.status === selectedFilter;
  });

  return (
    <MainLayout title="Camera Management" username={user?.username || 'User'} userRole={user?.role || 'admin'}>
      <div style={{ padding: '8px' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>จัดการกล้องวงจรปิด</h2>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>เพิ่ม แก้ไข และตรวจสอบสถานะของกล้องในระบบ</p>
        </div>

        {/* 4 Cards สรุปสถานะ ( Hover Effect อย่างเดียว ) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          
          <div 
            onClick={() => setSelectedFilter('all')} 
            onMouseEnter={() => setHoveredCard('all')}
            onMouseLeave={() => setHoveredCard(null)}
            style={getCardStyle('#2563eb', selectedFilter === 'all', hoveredCard === 'all')}
          >
            <span style={cardTitleStyle}>กล้องทั้งหมด</span>
            <div style={cardNumStyle}>{totalCount} <span style={unitStyle}>ตัว</span></div>
          </div>

          <div 
            onClick={() => setSelectedFilter('active')} 
            onMouseEnter={() => setHoveredCard('active')}
            onMouseLeave={() => setHoveredCard(null)}
            style={getCardStyle('#16a34a', selectedFilter === 'active', hoveredCard === 'active')}
          >
            <span style={cardTitleStyle}>ใช้งานปกติ (Active)</span>
            <div style={cardNumStyle}>{activeCount} <span style={unitStyle}>ตัว</span></div>
          </div>

          <div 
            onClick={() => setSelectedFilter('maintenance')} 
            onMouseEnter={() => setHoveredCard('maintenance')}
            onMouseLeave={() => setHoveredCard(null)}
            style={getCardStyle('#d97706', selectedFilter === 'maintenance', hoveredCard === 'maintenance')}
          >
            <span style={cardTitleStyle}>ส่งซ่อม (Maintenance)</span>
            <div style={cardNumStyle}>{maintenanceCount} <span style={unitStyle}>ตัว</span></div>
          </div>

          <div 
            onClick={() => setSelectedFilter('inactive')} 
            onMouseEnter={() => setHoveredCard('inactive')}
            onMouseLeave={() => setHoveredCard(null)}
            style={getCardStyle('#dc2626', selectedFilter === 'inactive', hoveredCard === 'inactive')}
          >
            <span style={cardTitleStyle}>ปิดใช้งาน (Inactive)</span>
            <div style={cardNumStyle}>{inactiveCount} <span style={unitStyle}>ตัว</span></div>
          </div>

        </div>

        {/* Form เพิ่มกล้องใหม่ */}
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '32px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#334155' }}>+ เพิ่มกล้องใหม่</h3>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 160px 120px', gap: '16px', alignItems: 'end' }}>
            <div>
              <label style={labelStyle}>Sub Location</label>
              <input
                type="text"
                placeholder="เช่น ชั้น 2 ห้องโถง"
                value={createData.sub_location}
                onChange={(e) => setCreateData({ ...createData, sub_location: e.target.value })}
                required
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Location</label>
              <input
                type="text"
                placeholder="เช่น อาคาร A"
                value={createData.location}
                onChange={(e) => setCreateData({ ...createData, location: e.target.value })}
                required
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select
                value={createData.status}
                onChange={(e) => setCreateData({ ...createData, status: e.target.value })}
                style={inputStyle}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <button type="submit" style={btnPrimary}>บันทึก</button>
          </form>
        </div>

        {/* ตารางแสดงผล */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          {selectedFilter !== 'all' && (
            <div style={{ padding: '12px 16px', backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#475569' }}>
                กำลังกรองแสดงผลเฉพาะ: <strong>{selectedFilter.toUpperCase()}</strong> ({filteredCameras.length} รายการ)
              </span>
              <button onClick={() => setSelectedFilter('all')} style={{ border: 'none', background: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>
                ล้างการกรองทั้งหมด
              </button>
            </div>
          )}

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '16px' }}>Camera ID</th>
                <th style={{ padding: '16px' }}>Sub Location</th>
                <th style={{ padding: '16px' }}>Location</th>
                <th style={{ padding: '16px' }}>Status</th>
                <th style={{ padding: '16px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCameras.length > 0 ? (
                filteredCameras.map((cam) => (
                  <tr key={cam.camera_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px', fontFamily: 'monospace', color: '#64748b' }}>{cam.camera_id}</td>
                    <td style={{ padding: '16px', fontWeight: '500' }}>{cam.sub_location}</td>
                    <td style={{ padding: '16px' }}>{cam.location}</td>
                    <td style={{ padding: '16px' }}><StatusBadge status={cam.status} /></td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <button onClick={() => openEditModal(cam)} style={btnEdit}>แก้ไข</button>
                      <button onClick={() => handleDelete(cam.camera_id)} style={btnDelete}>ลบ</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                    ไม่พบข้อมูลกล้องตามเงื่อนไขการกรอง
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Edit Modal */}
        {isEditModalOpen && (
          <div style={modalOverlay}>
            <div style={modalBox}>
              <h3 style={{ marginTop: 0, marginBottom: '16px' }}>แก้ไขข้อมูลกล้อง</h3>
              <form onSubmit={handleUpdate}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={labelStyle}>Sub Location</label>
                  <input
                    type="text"
                    value={editingCamera.sub_location}
                    onChange={(e) => setEditingCamera({ ...editingCamera, sub_location: e.target.value })}
                    style={inputStyle}
                    required
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={labelStyle}>Location</label>
                  <input
                    type="text"
                    value={editingCamera.location}
                    onChange={(e) => setEditingCamera({ ...editingCamera, location: e.target.value })}
                    style={inputStyle}
                    required
                  />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={labelStyle}>Status</label>
                  <select
                    value={editingCamera.status}
                    onChange={(e) => setEditingCamera({ ...editingCamera, status: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button type="button" onClick={() => setIsEditModalOpen(false)} style={btnCancel}>ยกเลิก</button>
                  <button type="submit" style={btnPrimary}>อัปเดตข้อมูล</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
};

const StatusBadge = ({ status }) => {
  const styles = {
    active: { bg: '#dcfce7', color: '#15803d', label: 'Active' },
    inactive: { bg: '#fee2e2', color: '#b91c1c', label: 'Inactive' },
    maintenance: { bg: '#fef3c7', color: '#b45309', label: 'Maintenance' },
  };
  const current = styles[status] || styles.active;
  return (
    <span style={{ backgroundColor: current.bg, color: current.color, padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: '600' }}>
      {current.label}
    </span>
  );
};

// Style สำหรับ Card (Hover แล้วลอยตัวขึ้น 4px + เพิ่ม shadow)
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

const cardTitleStyle = { fontSize: '13px', color: '#64748b', fontWeight: '500' };
const cardNumStyle = { fontSize: '24px', fontWeight: 'bold', color: '#1e293b', marginTop: '4px' };
const unitStyle = { fontSize: '13px', fontWeight: 'normal', color: '#64748b' };

const inputStyle = { padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', width: '100%', boxSizing: 'border-box' };
const btnPrimary = { backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', height: '40px' };
const btnEdit = { backgroundColor: '#f1f5f9', color: '#334155', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', marginRight: '8px' };
const btnDelete = { backgroundColor: '#fef2f2', color: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' };
const btnCancel = { backgroundColor: '#e2e8f0', color: '#475569', border: 'none', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer' };
const labelStyle = { display: 'block', fontSize: '13px', fontWeight: '500', color: '#475569', marginBottom: '6px' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalBox = { backgroundColor: '#fff', padding: '24px', borderRadius: '12px', width: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' };

export default CameraManagement;