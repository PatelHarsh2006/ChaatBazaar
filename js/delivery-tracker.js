const deliveryTracker = (() => {
  const stageDefinitions = [
    {
      key: 'preparing',
      label: 'Preparing Order 🍳',
      message: 'Your order is being prepared with love... 🍳',
      progress: '0%',
      cartTranslate: '0%'
    },
    {
      key: 'packed',
      label: 'Packed 📦',
      message: 'Freshly packaged and ready to leave the stall! 📦',
      progress: '33%',
      cartTranslate: '28%'
    },
    {
      key: 'out-for-delivery',
      label: 'Out for Delivery 🚲',
      message: 'Vendor is pedaling hot chaat straight to you! 🚲',
      progress: '66%',
      cartTranslate: '62%'
    },
    {
      key: 'delivered',
      label: 'Delivered ✅',
      message: 'Order delivered — enjoy your street food feast! ✅',
      progress: '100%',
      cartTranslate: '90%'
    }
  ];

  let modal = null;
  let cartEl = null;
  let progressBar = null;
  let statusText = null;
  let steps = [];
  let closeBtn = null;
  let activeStageIndex = 0;
  let stageTimeouts = [];

  const queryTrackerElements = () => {
    modal = document.getElementById('delivery-modal');
    cartEl = document.getElementById('vendor-cart');
    progressBar = document.getElementById('active-progress-bar');
    statusText = document.getElementById('live-status-text');
    steps = Array.from(document.querySelectorAll('.progress-steps .step'));
    closeBtn = document.getElementById('close-delivery-modal');
  };

  const delay = (ms) => new Promise((resolve) => {
    const id = setTimeout(resolve, ms);
    stageTimeouts.push(id);
  });

  const clearStageTimers = () => {
    stageTimeouts.forEach((id) => clearTimeout(id));
    stageTimeouts = [];
  };

  const hideModal = () => {
    if (!modal) return;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    clearStageTimers();
  };

  const updateStepVisuals = (index) => {
    steps.forEach((step, stepIndex) => {
      step.classList.toggle('completed', stepIndex < index);
      step.classList.toggle('active', stepIndex === index);
      step.classList.toggle('current', stepIndex === index);
    });
  };

  const updateStage = (stageIndex) => {
    if (!stageDefinitions[stageIndex] || !progressBar || !cartEl || !statusText) return;

    const stage = stageDefinitions[stageIndex];
    activeStageIndex = stageIndex;

    const progressValue = stage.progress;
    const cartPosition = stage.cartTranslate;

    progressBar.style.width = progressValue;
    cartEl.style.transform = `translateX(${cartPosition})`;
    statusText.textContent = stage.message;
    statusText.classList.toggle('success', stageIndex === stageDefinitions.length - 1);
    statusText.setAttribute('aria-live', 'polite');
    statusText.setAttribute('aria-atomic', 'true');
    statusText.setAttribute('aria-label', stage.message);

    updateStepVisuals(stageIndex);

    if (stageIndex === stageDefinitions.length - 1) {
      if (closeBtn) {
        closeBtn.classList.remove('hidden');
        closeBtn.textContent = 'View Order Status';
      }
    }
  };

  const resetTracker = () => {
    if (!modal || !progressBar || !cartEl || !statusText) return;

    clearStageTimers();
    activeStageIndex = 0;
    progressBar.style.width = '0%';
    cartEl.style.transform = 'translateX(0%)';
    statusText.textContent = stageDefinitions[0].message;
    statusText.classList.remove('success');
    updateStepVisuals(0);

    if (closeBtn) {
      closeBtn.classList.add('hidden');
      closeBtn.textContent = 'View Order Status';
    }
  };

  const openModal = () => {
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    modal.querySelector('.delivery-modal-content')?.focus();
  };

  const startSimulation = async () => {
    if (!modal || !cartEl || !progressBar || !statusText || steps.length === 0) return;

    clearStageTimers();
    resetTracker();
    openModal();

    for (let index = 0; index < stageDefinitions.length; index += 1) {
      updateStage(index);
      if (index === stageDefinitions.length - 1) {
        break;
      }
      await delay(index === 0 ? 2400 : index === 1 ? 2600 : 2800);
    }
  };

  const bindEvents = () => {
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        hideModal();
        window.location.href = 'orders.html';
      });
    }

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
        hideModal();
      }
    });
  };

  const initialize = () => {
    queryTrackerElements();
    bindEvents();
    resetTracker();
    window.triggerDeliverySimulation = startSimulation;
  };

  return {
    init: initialize
  };
})();

window.triggerDeliverySimulation = window.triggerDeliverySimulation || function () {
  console.warn('Delivery tracker initializing shortly.');
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', deliveryTracker.init);
} else {
  deliveryTracker.init();
}
