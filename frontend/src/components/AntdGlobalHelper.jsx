import { App } from 'antd';

let messageStatic = {
  success: (...args) => console.log('success', ...args),
  error: (...args) => console.log('error', ...args),
  warning: (...args) => console.log('warning', ...args),
  info: (...args) => console.log('info', ...args),
  loading: (...args) => console.log('loading', ...args),
};

let notificationStatic = {
  success: (...args) => console.log('notif-success', ...args),
  error: (...args) => console.log('notif-error', ...args),
  warning: (...args) => console.log('notif-warning', ...args),
  info: (...args) => console.log('notif-info', ...args),
};

let modalStatic = null;

export default function AntdGlobalHelper() {
  const { message, notification, modal } = App.useApp();
  messageStatic.success = message.success;
  messageStatic.error = message.error;
  messageStatic.warning = message.warning;
  messageStatic.info = message.info;
  messageStatic.loading = message.loading;
  
  notificationStatic.success = notification.success;
  notificationStatic.error = notification.error;
  notificationStatic.warning = notification.warning;
  notificationStatic.info = notification.info;
  if (notification.destroy) notificationStatic.destroy = notification.destroy;
  
  modalStatic = modal;
  return null;
}

export { messageStatic as message, notificationStatic as notification, modalStatic as modal };
