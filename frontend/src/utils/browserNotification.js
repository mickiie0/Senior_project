// Desktop/Web Browser Notification Utility

export const isNotificationSupported = () => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    if (Notification.permission === 'default') {
      return await Notification.requestPermission();
    }
    return Notification.permission;
  } catch (err) {
    console.warn('Error requesting notification permission:', err);
    return 'denied';
  }
};

export const sendDesktopNotification = ({
  title = '🚨 ตรวจพบสัญญาณเพลิงไหม้!',
  body = 'ระบบกล้องวงจรปิด AI ตรวจพบเหตุการณ์ผิดปกติในพื้นที่',
  icon = '/logo/fire.png',
  tag = 'fire-alert',
  onClick = null,
}) => {
  if (!isNotificationSupported()) return null;

  if (Notification.permission === 'granted') {
    try {
      const notif = new Notification(title, {
        body,
        icon,
        tag,
        requireInteraction: true, // Keep notification visible until user interacts
      });

      notif.onclick = () => {
        window.focus();
        if (typeof onClick === 'function') {
          onClick();
        }
        notif.close();
      };

      return notif;
    } catch (err) {
      console.warn('Unable to trigger desktop notification:', err);
      return null;
    }
  }

  return null;
};
