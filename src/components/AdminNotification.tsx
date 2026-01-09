import React, { useEffect, useState } from 'react';
import { AlertCircle, MessageCircle, Bell, X } from 'lucide-react';

export interface Notification {
  id: string;
  type: 'message' | 'info' | 'warning' | 'success';
  title: string;
  message: string;
  chatId?: string;
  senderName?: string;
  duration?: number;
}

interface AdminNotificationProps {
  notification: Notification;
  onClose: (id: string) => void;
  onClick?: (id: string) => void;
}

const AdminNotificationItem: React.FC<AdminNotificationProps> = ({ notification, onClose, onClick }) => {
  useEffect(() => {
    if (notification.duration) {
      const timer = setTimeout(() => onClose(notification.id), notification.duration);
      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  const getStyles = () => {
    switch (notification.type) {
      case 'message':
        return 'bg-blue-500 border-blue-600';
      case 'success':
        return 'bg-green-500 border-green-600';
      case 'warning':
        return 'bg-yellow-500 border-yellow-600';
      case 'info':
        return 'bg-purple-500 border-purple-600';
      default:
        return 'bg-gray-500 border-gray-600';
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'message':
        return <MessageCircle className="h-5 w-5" />;
      case 'success':
        return <Bell className="h-5 w-5" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5" />;
      case 'info':
        return <Bell className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  return (
    <div
      className={`${getStyles()} text-white px-5 py-4 rounded-lg shadow-2xl border-l-4 border-opacity-60 flex items-start justify-between gap-3 cursor-pointer hover:shadow-3xl transition-shadow animate-in slide-in-from-top-5 duration-300`}
      onClick={() => onClick?.(notification.id || '')}
    >
      <div className="flex items-start gap-3 flex-1">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm">
            {notification.title}
          </h3>
          <p className="text-xs mt-1 opacity-90 line-clamp-2">
            {notification.message}
          </p>
          {notification.senderName && (
            <p className="text-xs mt-1 opacity-75">
              De: <span className="font-semibold">{notification.senderName}</span>
            </p>
          )}
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose(notification.id);
        }}
        className="flex-shrink-0 hover:opacity-75 transition-opacity"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export interface AdminNotificationsContainerProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
  onNotificationClick?: (id: string) => void;
}

export const AdminNotificationsContainer: React.FC<AdminNotificationsContainerProps> = ({
  notifications,
  onRemove,
  onNotificationClick,
}) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md pointer-events-none">
      {notifications.map((notification) => (
        <div key={notification.id} className="pointer-events-auto">
          <AdminNotificationItem
            notification={notification}
            onClose={onRemove}
            onClick={onNotificationClick}
          />
        </div>
      ))}
    </div>
  );
};

export default AdminNotificationItem;
