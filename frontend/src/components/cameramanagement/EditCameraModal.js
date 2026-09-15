import React from 'react';
import { Camera, X } from 'lucide-react';
import styles from './CameraManagementStyles';
import { CAMERA_STATUS } from './CameraManagementHelpers';

const EditCameraModal = ({ isOpen, editingCamera, onChange, onSubmit, onClose }) => {
  if (!isOpen || !editingCamera) return null;

  return (
    <div style={styles.modalBackdrop} onClick={onClose}>
      <div style={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={styles.modalHeader}>
          <div style={styles.modalHeaderTitleRow}>
            <Camera size={20} color="#2563eb" />
            <div>
              <h3 style={styles.modalTitle}>แก้ไขข้อมูลกล้อง {editingCamera.camera_id}</h3>
              <div style={styles.modalSubtitle}>
                ปรับปรุง IP Address สถานที่ติดตั้ง หรือเปลี่ยนสถานะการทำงาน
              </div>
            </div>
          </div>
          <button onClick={onClose} style={styles.modalCloseBtn} title="ปิดหน้าต่าง">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={onSubmit}>
          <div style={styles.modalBody}>
            <div style={styles.modalFieldGroup}>
              <label style={styles.label}>IP Address</label>
              <input
                type="text"
                value={editingCamera.ip_address || ''}
                onChange={(e) => onChange({ ...editingCamera, ip_address: e.target.value })}
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
                onChange={(e) => onChange({ ...editingCamera, location: e.target.value })}
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
                onChange={(e) => onChange({ ...editingCamera, sub_location: e.target.value })}
                style={styles.input}
                className="cam-input"
                required
              />
            </div>

            <div style={styles.modalFieldGroup}>
              <label style={styles.label}>สถานะการทำงาน (Status)</label>
              <select
                value={editingCamera.status}
                onChange={(e) => onChange({ ...editingCamera, status: e.target.value })}
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
            <button type="button" onClick={onClose} style={styles.modalCancelBtn}>
              ยกเลิก
            </button>
            <button type="submit" style={styles.modalSubmitBtn}>
              บันทึกการแก้ไข
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCameraModal;
