import React, { createContext, useContext, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './NotificationSystem.css';

// Contexto para gerenciar notificações globalmente
const NotificationContext = createContext();

// Provedor de notificações
export const NotificationProvider = ({ children }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', message: '' });
  const [bannerVisible, setBannerVisible] = useState(false);
  const [bannerContent, setBannerContent] = useState({ message: '', type: 'info' });

  // Função para exibir toast
  const showToast = (message, type = 'info') => {
    const options = {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    };

    switch (type) {
      case 'success':
        toast.success(message, options);
        break;
      case 'error':
        toast.error(message, options);
        break;
      case 'warning':
        toast.warning(message, options);
        break;
      case 'info':
      default:
        toast.info(message, options);
        break;
    }
  };

  // Função para exibir modal
  const showModal = (title, message) => {
    setModalContent({ title, message });
    setModalVisible(true);
  };

  // Função para fechar modal
  const closeModal = () => {
    setModalVisible(false);
  };

  // Função para exibir banner
  const showBanner = (message, type = 'info') => {
    setBannerContent({ message, type });
    setBannerVisible(true);
  };

  // Função para fechar banner
  const closeBanner = () => {
    setBannerVisible(false);
  };

  // Valor do contexto
  const value = {
    showToast,
    showModal,
    closeModal,
    showBanner,
    closeBanner
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      
      {/* Toast Container */}
      <ToastContainer />
      
      {/* Modal */}
      {modalVisible && (
        <div className="notification-modal-overlay">
          <div className="notification-modal">
            <div className="notification-modal-header">
              <h2>{modalContent.title}</h2>
              <button onClick={closeModal} className="notification-modal-close">&times;</button>
            </div>
            <div className="notification-modal-body">
              <p>{modalContent.message}</p>
            </div>
            <div className="notification-modal-footer">
              <button onClick={closeModal} className="notification-modal-button">Fechar</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Banner */}
      {bannerVisible && (
        <div className={`notification-banner ${bannerContent.type}`}>
          <p>{bannerContent.message}</p>
          <button onClick={closeBanner} className="notification-banner-close">&times;</button>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

// Hook para usar notificações
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification deve ser usado dentro de um NotificationProvider');
  }
  return context;
};

export default NotificationProvider;
