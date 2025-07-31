import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useAtom } from 'jotai';
import { notificationAtom } from '../atoms';

const Notify = ({ interval = 3000, silent = false }) => {
  const [notification, setNotification] = useAtom(notificationAtom);

  useEffect(() => {
    if (notification) {
      // Log error notification details to the console
      if (notification.type === 'error') {
        console.log(`[${notification.type}]: ${notification.message}`);
      }

      // If not silent, automatically clear the notification after the specified interval
      if (!silent) {
        const timeout = setTimeout(() => {
          setNotification(null);
        }, interval);
        return () => clearTimeout(timeout); // Cleanup timeout
      }
    }
  }, [notification, setNotification, interval, silent]);

  // Don't display notifications if silent is true
  if (!notification || silent) return null;

  const { type, message } = notification;

  const bannerStyle = {
    backgroundColor: type === 'success' ? 'green' : type === 'error' ? 'red' : 'orange',
  };

  return <div className="notify-text" style={bannerStyle}>{message}</div>;
};

Notify.propTypes = {
  interval: PropTypes.number, // Validate interval as a number
  silent: PropTypes.bool,     // Validate silent as a boolean
};

export default Notify;

