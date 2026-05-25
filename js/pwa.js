// ===== ChaatBazaar PWA Integration & Connection Engine =====

document.addEventListener('DOMContentLoaded', () => {
  initServiceWorker();
  initConnectionStatus();
  initToastContainer();
  checkPendingOrdersOnStartup();
  initInstallBanner();
});

// 1. Register Service Worker
function initServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker registered successfully with scope:', registration.scope);
        })
        .catch((error) => {
          console.error('[PWA] Service Worker registration failed:', error);
        });
    });
  }
}

// 2. Connection Status Indicator
function initConnectionStatus() {
  // Create Connection Status Badge
  const badge = document.createElement('div');
  badge.id = 'connection-badge';
  badge.className = navigator.onLine ? 'connection-badge online' : 'connection-badge offline';
  badge.innerHTML = `
    <span class="badge-dot"></span>
    <span class="badge-text">${navigator.onLine ? 'Online' : 'Offline'}</span>
  `;

  // Inject into the header dynamically
  const headerInner = document.querySelector('.header-inner') || document.querySelector('header');
  if (headerInner) {
    headerInner.appendChild(badge);
  } else {
    document.body.prepend(badge); // Fallback
  }

  // Event Listeners for Online/Offline transitions
  window.addEventListener('online', () => {
    updateConnectionUI(true);
    showToast('Internet connection restored! Welcome back.', 'success');
    
    // Automatically trigger order synchronization if custom main.js handler exists
    if (window.syncPendingOrders && typeof window.syncPendingOrders === 'function') {
      window.syncPendingOrders();
    }
  });

  window.addEventListener('offline', () => {
    updateConnectionUI(false);
    showToast('You are offline. Browse saved pages & manage your cart offline!', 'warning');
  });
}

function updateConnectionUI(isOnline) {
  const badge = document.getElementById('connection-badge');
  if (!badge) return;

  if (isOnline) {
    badge.className = 'connection-badge online';
    badge.querySelector('.badge-text').textContent = 'Online';
  } else {
    badge.className = 'connection-badge offline';
    badge.querySelector('.badge-text').textContent = 'Offline';
  }
}

// 3. Modern Toast Notification System
let toastContainer = null;

function initToastContainer() {
  toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);
  }
}

/**
 * Show a premium custom toast notification
 * @param {string} message - Message text
 * @param {string} type - 'success', 'warning', 'error', 'info'
 */
function showToast(message, type = 'info') {
  if (!toastContainer) {
    initToastContainer();
  }

  const toast = document.createElement('div');
  toast.className = `chaat-toast toast-${type}`;
  
  let icon = 'fa-info-circle';
  if (type === 'success') icon = 'fa-circle-check';
  if (type === 'warning') icon = 'fa-triangle-exclamation';
  if (type === 'error') icon = 'fa-circle-xmark';

  toast.innerHTML = `
    <i class="fa-solid ${icon} toast-icon"></i>
    <span class="toast-message">${message}</span>
    <button class="toast-close" aria-label="Close Notification">&times;</button>
  `;

  // Append and animate
  toastContainer.appendChild(toast);

  // Close button click handler
  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => {
    dismissToast(toast);
  });

  // Auto-dismiss after 4 seconds
  setTimeout(() => {
    dismissToast(toast);
  }, 4500);
}

function dismissToast(toast) {
  toast.classList.add('toast-dismissing');
  toast.addEventListener('transitionend', () => {
    toast.remove();
  });
  // Fallback in case transition fails
  setTimeout(() => {
    if (toast.parentNode) {
      toast.remove();
    }
  }, 500);
}

// 4. Offline orders status check
function checkPendingOrdersOnStartup() {
  try {
    const pending = localStorage.getItem('chaatPendingOrders');
    if (pending) {
      const pendingOrders = JSON.parse(pending);
      if (pendingOrders.length > 0) {
        // Delay slightly for visual effect after page load
        setTimeout(() => {
          showToast(`You have ${pendingOrders.length} offline order(s) queued. ${navigator.onLine ? 'Syncing now...' : 'They will sync when you reconnect!'}`, 'info');
        }, 1500);
      }
    }
  } catch (e) {
    console.error('Error checking pending orders:', e);
  }
}

// Expose toast function globally
window.showChaatToast = showToast;

// 5. PWA Install Prompter & Banner Engine
let deferredPrompt = null;

function initInstallBanner() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;

  // Handle iOS specific offline installation tip
  if (isIOS && !isStandalone) {
    const iosDismissed = sessionStorage.getItem('chaatIosTipDismissed');
    if (!iosDismissed) {
      setTimeout(() => {
        showIosInstallTip();
      }, 5000); // Delay slightly for seamless onload experience
    }
    return;
  }

  // Handle Android/Desktop installation prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent default browser banner from showing
    e.preventDefault();
    // Stash event to trigger later
    deferredPrompt = e;

    const bannerDismissed = sessionStorage.getItem('chaatPwaBannerDismissed');
    if (!bannerDismissed && !isStandalone) {
      showInstallBanner();
    }
  });

  window.addEventListener('appinstalled', (evt) => {
    console.log('[PWA] ChaatBazaar app was installed successfully!');
    hideInstallBanner();
    showToast('ChaatBazaar installed successfully! You can now order offline.', 'success');
  });
}

function showInstallBanner() {
  let banner = document.getElementById('pwa-install-banner');
  if (banner) return; // Already exists

  banner = document.createElement('div');
  banner.id = 'pwa-install-banner';
  banner.className = 'pwa-install-banner';
  
  banner.innerHTML = `
    <div class="banner-inner container">
      <div class="banner-content-left">
        <div class="banner-icon-badge">📱</div>
        <div class="banner-info-text">
          <strong>Download ChaatBazaar App!</strong>
          <span>Install now for faster load times and fully functional offline food ordering.</span>
        </div>
      </div>
      <div class="banner-content-right">
        <button id="pwa-install-btn" class="btn-banner-install">Install Now</button>
        <button id="pwa-dismiss-btn" class="btn-banner-dismiss" aria-label="Dismiss Notification">&times;</button>
      </div>
    </div>
  `;

  // Inject banner below header
  const header = document.querySelector('header');
  if (header) {
    header.parentNode.insertBefore(banner, header.nextSibling);
  } else {
    document.body.prepend(banner);
  }

  // Attach button event listeners
  const installBtn = document.getElementById('pwa-install-btn');
  const dismissBtn = document.getElementById('pwa-dismiss-btn');

  installBtn.addEventListener('click', () => {
    if (!deferredPrompt) return;
    
    // Show prompt
    deferredPrompt.prompt();
    
    // Wait for user choice
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] User accepted PWA installation');
      } else {
        console.log('[PWA] User dismissed PWA installation');
      }
      deferredPrompt = null;
      hideInstallBanner();
    });
  });

  dismissBtn.addEventListener('click', () => {
    sessionStorage.setItem('chaatPwaBannerDismissed', 'true');
    hideInstallBanner();
  });
}

function hideInstallBanner() {
  const banner = document.getElementById('pwa-install-banner');
  if (banner) {
    banner.classList.add('banner-slide-up');
    banner.addEventListener('animationend', () => {
      banner.remove();
    });
    // Fallback if animation fails
    setTimeout(() => {
      if (banner.parentNode) banner.remove();
    }, 400);
  }
}

// iOS Specific Add-to-Home-Screen Tooltip
function showIosInstallTip() {
  const tip = document.createElement('div');
  tip.id = 'pwa-ios-tip';
  tip.className = 'pwa-ios-tip';
  tip.innerHTML = `
    <div class="ios-tip-header">
      <span>📱 Install ChaatBazaar</span>
      <button id="pwa-ios-close" class="ios-close-btn">&times;</button>
    </div>
    <p class="ios-tip-desc">
      To order food offline on your iPhone, tap the <strong>Share</strong> icon <i class="fa-solid fa-arrow-up-from-bracket"></i> in Safari, and select <strong>"Add to Home Screen"</strong>.
    </p>
    <div class="ios-tip-arrow"></div>
  `;

  document.body.appendChild(tip);

  document.getElementById('pwa-ios-close').addEventListener('click', () => {
    sessionStorage.setItem('chaatIosTipDismissed', 'true');
    tip.classList.add('ios-tip-dismissing');
    tip.addEventListener('animationend', () => {
      tip.remove();
    });
    setTimeout(() => { if (tip.parentNode) tip.remove(); }, 400);
  });
}

