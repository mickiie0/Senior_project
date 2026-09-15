import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/mainlayout/MainLayout';

import CameraManagementGlobalStyles from '../components/cameramanagement/CameraManagementGlobalStyles';
import CameraManagementHeader from '../components/cameramanagement/CameraManagementHeader';
import CameraSummaryCards from '../components/cameramanagement/CameraSummaryCards';
import AddCameraForm from '../components/cameramanagement/AddCameraForm';
import CameraFilterToolbar from '../components/cameramanagement/CameraFilterToolbar';
import CameraTable from '../components/cameramanagement/CameraTable';
import EditCameraModal from '../components/cameramanagement/EditCameraModal';

import styles from '../components/cameramanagement/CameraManagementStyles';
import { API_BASE_URL, CAMERA_STATUS, getAuthHeaders } from '../components/cameramanagement/CameraManagementHelpers';

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

  const fetchCameras = useCallback(
    async (isManual = false) => {
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
    },
    [handleSessionExpired]
  );

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

        const match = id.includes(q) || ip.includes(q) || loc.includes(q) || subLoc.includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [cameras, selectedFilter, searchTerm]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedFilter('all');
  };

  return (
    <MainLayout title="Camera Management" username={user?.username || 'User'} userRole={user?.role || 'admin'}>
      <CameraManagementGlobalStyles />

      <div style={styles.page}>
        <CameraManagementHeader isRefreshing={isRefreshing} onRefresh={() => fetchCameras(true)} />

        {/* 4 KPI Summary Cards (display only, click-to-filter removed) */}
        <CameraSummaryCards
          totalCount={totalCount}
          activeCount={activeCount}
          maintenanceCount={maintenanceCount}
          inactiveCount={inactiveCount}
          uptimePercent={uptimePercent}
        />

        <AddCameraForm
          createData={createData}
          onCreateDataChange={setCreateData}
          onSubmit={handleCreate}
          isSubmitting={isSubmitting}
          isTestingIP={isTestingIP}
          onTestConnection={handleTestConnection}
          testResult={testResult}
          onClearTestResult={() => setTestResult(null)}
        />

        <CameraFilterToolbar
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          selectedFilter={selectedFilter}
          onSelectedFilterChange={setSelectedFilter}
          totalCount={totalCount}
          activeCount={activeCount}
          maintenanceCount={maintenanceCount}
          inactiveCount={inactiveCount}
          onResetFilters={handleResetFilters}
        />

        <CameraTable
          loading={loading}
          cameras={cameras}
          filteredCameras={filteredCameras}
          onEdit={openEditModal}
          onDelete={handleDelete}
        />

        <EditCameraModal
          isOpen={isEditModalOpen}
          editingCamera={editingCamera}
          onChange={setEditingCamera}
          onSubmit={handleUpdate}
          onClose={() => setIsEditModalOpen(false)}
        />
      </div>
    </MainLayout>
  );
};

export default CameraManagement;