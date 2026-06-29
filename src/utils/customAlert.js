export const customAlert = (message, type = 'info') => {
  // Check if an alert container exists, if not create one
  let container = document.getElementById('custom-alert-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'custom-alert-container';
    Object.assign(container.style, {
      position: 'fixed',
      top: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: '99999',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      pointerEvents: 'none'
    });
    document.body.appendChild(container);
  }

  // Create alert element
  const alertEl = document.createElement('div');
  
  // Style based on type (info, success, warning, error)
  let bgColor = '#1a4a5e'; // default info
  let icon = '💡';
  if (type === 'success') { bgColor = '#10b981'; icon = '✅'; }
  if (type === 'warning') { bgColor = '#f59e0b'; icon = '⚠️'; }
  if (type === 'error') { bgColor = '#ef4444'; icon = '🚨'; }

  Object.assign(alertEl.style, {
    backgroundColor: bgColor,
    color: 'white',
    padding: '14px 24px',
    borderRadius: '12px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '14px',
    fontWeight: '600',
    fontFamily: '"Inter", sans-serif',
    letterSpacing: '0.02em',
    opacity: '0',
    transform: 'translateY(-20px) scale(0.95)',
    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    pointerEvents: 'auto',
    maxWidth: '90vw',
    textAlign: 'center'
  });

  alertEl.innerHTML = `<span style="font-size: 18px;">${icon}</span> <span>${message}</span>`;
  
  container.appendChild(alertEl);

  // Animate in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      alertEl.style.opacity = '1';
      alertEl.style.transform = 'translateY(0) scale(1)';
    });
  });

  // Animate out and remove
  setTimeout(() => {
    alertEl.style.opacity = '0';
    alertEl.style.transform = 'translateY(-20px) scale(0.95)';
    setTimeout(() => {
      alertEl.remove();
    }, 400);
  }, 4000);
};
