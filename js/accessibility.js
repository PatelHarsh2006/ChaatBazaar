// ===== Accessibility & Responsive Navigation Enhancements =====
// Screen reader support, keyboard navigation, dynamic mobile navigation, validation feedback, and ARIA improvements

// Setup skip links for keyboard navigation
function setupSkipLinks() {
  let mainContent = document.getElementById('main-content') || document.querySelector('main') || document.querySelector('section');
  if (mainContent) {
    if (!mainContent.id) {
      mainContent.id = 'main-content';
    }
    mainContent.setAttribute('tabindex', '-1');
    mainContent.style.outline = 'none';
  }

  // Check if skip link already exists
  if (document.querySelector('.skip-link')) return;

  const skipLink = document.createElement('a');
  skipLink.href = '#main-content';
  skipLink.className = 'skip-link';
  skipLink.textContent = 'Skip to main content';
  document.body.insertBefore(skipLink, document.body.firstChild);
}

// Setup mobile hamburger navigation and accessibility controls
function setupMobileNavigation() {
  const headerInner = document.querySelector('.header-inner');
  const nav = document.querySelector('nav');
  if (!headerInner || !nav) return;

  if (document.getElementById('mobile-nav-toggle')) return;

  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'mobile-nav-toggle';
  toggleBtn.className = 'mobile-nav-toggle';
  toggleBtn.setAttribute('aria-label', 'Open navigation menu');
  toggleBtn.setAttribute('aria-expanded', 'false');
  toggleBtn.setAttribute('aria-controls', 'primary-navigation');
  
  toggleBtn.innerHTML = `
    <span class="hamburger-bar"></span>
    <span class="hamburger-bar"></span>
    <span class="hamburger-bar"></span>
  `;

  if (!nav.id) {
    nav.id = 'primary-navigation';
  }

  headerInner.insertBefore(toggleBtn, nav);

  toggleBtn.addEventListener('click', () => {
    const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
    const nextState = !isExpanded;
    toggleBtn.setAttribute('aria-expanded', String(nextState));
    toggleBtn.setAttribute('aria-label', nextState ? 'Close navigation menu' : 'Open navigation menu');
    nav.classList.toggle('nav-open', nextState);
    document.body.classList.toggle('nav-menu-open', nextState);
    
    if (nextState) {
      const firstLink = nav.querySelector('a');
      if (firstLink) setTimeout(() => firstLink.focus(), 100);
    } else {
      toggleBtn.focus();
    }
  });

  const navLinks = nav.querySelectorAll('a:not(.dropdown-toggle)');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      toggleBtn.setAttribute('aria-expanded', 'false');
      toggleBtn.setAttribute('aria-label', 'Open navigation menu');
      nav.classList.remove('nav-open');
      document.body.classList.remove('nav-menu-open');
    });
  });

  // Dropdown accordions for mobile menu
  const dropdowns = nav.querySelectorAll('.dropdown');
  dropdowns.forEach(dropdown => {
    const toggle = dropdown.querySelector('.dropdown-toggle');
    if (!toggle) return;

    toggle.addEventListener('click', (e) => {
      if (window.innerWidth <= 1024) {
        e.preventDefault();
        e.stopPropagation();
        const isOpen = dropdown.classList.contains('open');
        
        dropdowns.forEach(d => {
          if (d !== dropdown) {
            d.classList.remove('open');
            const dToggle = d.querySelector('.dropdown-toggle');
            if (dToggle) dToggle.setAttribute('aria-expanded', 'false');
          }
        });

        dropdown.classList.toggle('open', !isOpen);
        toggle.setAttribute('aria-expanded', String(!isOpen));
      }
    });
  });

  // Trap focus and close drawer on Escape
  nav.addEventListener('keydown', (e) => {
    if (!nav.classList.contains('nav-open')) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      toggleBtn.setAttribute('aria-expanded', 'false');
      toggleBtn.setAttribute('aria-label', 'Open navigation menu');
      nav.classList.remove('nav-open');
      document.body.classList.remove('nav-menu-open');
      toggleBtn.focus();
    }

    if (e.key === 'Tab') {
      const focusable = nav.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex="0"]');
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          last.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    }
  });
}

// Enhance dropdown keyboard navigation for desktop
function setupDropdownKeyboardNav() {
  const dropdowns = document.querySelectorAll('.dropdown');

  dropdowns.forEach(dropdown => {
    const toggle = dropdown.querySelector('.dropdown-toggle');
    const menu = dropdown.querySelector('.dropdown-menu');
    const items = menu ? menu.querySelectorAll('a') : [];

    if (!toggle) return;

    toggle.addEventListener('keydown', (e) => {
      const isOpen = dropdown.classList.contains('open');

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        dropdown.classList.toggle('open');
        toggle.setAttribute('aria-expanded', dropdown.classList.contains('open') ? 'true' : 'false');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!isOpen) {
          dropdown.classList.add('open');
          toggle.setAttribute('aria-expanded', 'true');
        }
        if (items.length > 0) items[0].focus();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        dropdown.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });

    items.forEach((item, index) => {
      item.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          const nextIndex = (index + 1) % items.length;
          items[nextIndex].focus();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          const prevIndex = (index - 1 + items.length) % items.length;
          items[prevIndex].focus();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          dropdown.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
          toggle.focus();
        } else if (e.key === 'Home') {
          e.preventDefault();
          items[0].focus();
        } else if (e.key === 'End') {
          e.preventDefault();
          items[items.length - 1].focus();
        }
      });
    });
  });
}

// Enhance search suggestions keyboard navigation
function setupSearchKeyboardNav() {
  const searchInput = document.getElementById('search-input');
  const suggestionsContainer = document.getElementById('search-suggestions');

  if (!searchInput || !suggestionsContainer) return;

  let selectedIndex = -1;

  searchInput.addEventListener('keydown', (e) => {
    const items = suggestionsContainer.querySelectorAll('.suggestion-item');

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
      if (selectedIndex >= 0) {
        items.forEach(el => el.classList.remove('focused'));
        items[selectedIndex].classList.add('focused');
        items[selectedIndex].scrollIntoView({ block: 'nearest' });
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (selectedIndex > 0) {
        items[selectedIndex].classList.remove('focused');
        selectedIndex--;
        items[selectedIndex].classList.add('focused');
        items[selectedIndex].scrollIntoView({ block: 'nearest' });
      } else if (selectedIndex === 0) {
        items[selectedIndex].classList.remove('focused');
        selectedIndex = -1;
        searchInput.focus();
      }
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0) {
        e.preventDefault();
        items[selectedIndex].click();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      suggestionsContainer.style.display = 'none';
      selectedIndex = -1;
    }
  });

  searchInput.addEventListener('input', () => {
    selectedIndex = -1;
  });
}

// Enhance card keyboard navigation
function setupCardKeyboardNav() {
  const cards = document.querySelectorAll('.card');

  cards.forEach(card => {
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const addBtn = card.querySelector('.add-btn');
        if (addBtn) {
          e.preventDefault();
          addBtn.click();
        }
      }
    });
  });
}

// Field validation helper for ARIA updates
function validateField(input, errorMsg) {
  let isValid = true;
  let message = '';
  const value = input.value.trim();

  if (input.required && !value) {
    isValid = false;
    message = `${input.previousElementSibling ? input.previousElementSibling.textContent.trim() : 'Field'} is required.`;
  } else if (input.type === 'email' && value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      isValid = false;
      message = 'Please enter a valid email address.';
    }
  } else if (input.tagName === 'TEXTAREA' && value && value.length < 10) {
    isValid = false;
    message = 'Message must be at least 10 characters.';
  }

  if (!isValid) {
    input.setAttribute('aria-invalid', 'true');
    input.classList.add('input-error');
    if (errorMsg) {
      errorMsg.textContent = message;
      errorMsg.style.display = 'block';
    }
  } else {
    input.setAttribute('aria-invalid', 'false');
    input.classList.remove('input-error');
    if (errorMsg) {
      errorMsg.textContent = '';
    }
  }

  return isValid;
}

// Auth fields validation validation
function validateAuthField(input, errorMsg) {
  let isValid = true;
  let message = '';
  const value = input.value.trim();

  if (input.required && !value) {
    isValid = false;
    message = 'This field is required.';
  } else if (input.type === 'email' && value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      isValid = false;
      message = 'Please enter a valid email address.';
    }
  } else if (input.type === 'password' && value && value.length < 6) {
    isValid = false;
    message = 'Password must be at least 6 characters.';
  } else if (input.type === 'tel' && value && !/^\d{10}$/.test(value)) {
    isValid = false;
    message = 'Please enter a valid 10-digit phone number.';
  }

  if (!isValid) {
    input.setAttribute('aria-invalid', 'true');
    input.classList.add('input-error');
    if (errorMsg) {
      errorMsg.textContent = message;
    }
  } else {
    input.setAttribute('aria-invalid', 'false');
    input.classList.remove('input-error');
    if (errorMsg) {
      errorMsg.textContent = '';
    }
  }
  return isValid;
}

// Enhance form accessibility with proper labels and error associations
function setupFormAccessibility() {
  const contactForm = document.getElementById('contact-form');
  const newsLetterForm = document.getElementById('newsletter-form');
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');

  if (contactForm) {
    const inputs = contactForm.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      const errorMsg = contactForm.querySelector(`#error-${input.id}`);
      if (errorMsg) {
        input.setAttribute('aria-describedby', `error-${input.id}`);
      }

      input.addEventListener('blur', () => {
        validateField(input, errorMsg);
      });

      input.addEventListener('input', () => {
        input.removeAttribute('aria-invalid');
        input.classList.remove('input-error');
        if (errorMsg) errorMsg.textContent = '';
      });
    });

    contactForm.addEventListener('submit', (e) => {
      let isFormValid = true;
      inputs.forEach(input => {
        const errorMsg = contactForm.querySelector(`#error-${input.id}`);
        const isValid = validateField(input, errorMsg);
        if (!isValid) isFormValid = false;
      });

      if (!isFormValid) {
        e.preventDefault();
        e.stopPropagation();
        const firstInvalid = contactForm.querySelector('[aria-invalid="true"]');
        if (firstInvalid) firstInvalid.focus();
      }
    });
  }

  if (loginForm) {
    const inputs = loginForm.querySelectorAll('input');
    inputs.forEach(input => {
      const errorMsg = loginForm.querySelector(`#${input.id}-error`);
      if (errorMsg) {
        input.setAttribute('aria-describedby', `${input.id}-error`);
      }
      
      input.addEventListener('input', () => {
        input.removeAttribute('aria-invalid');
        input.classList.remove('input-error');
        if (errorMsg) errorMsg.textContent = '';
      });
      
      input.addEventListener('blur', () => {
        validateAuthField(input, errorMsg);
      });
    });
  }

  if (signupForm) {
    const inputs = signupForm.querySelectorAll('input');
    inputs.forEach(input => {
      const errorMsg = signupForm.querySelector(`#${input.id}-error`);
      if (errorMsg) {
        input.setAttribute('aria-describedby', `${input.id}-error`);
      }
      
      input.addEventListener('input', () => {
        input.removeAttribute('aria-invalid');
        input.classList.remove('input-error');
        if (errorMsg) errorMsg.textContent = '';
      });
      
      input.addEventListener('blur', () => {
        validateAuthField(input, errorMsg);
      });
    });
  }

  if (newsLetterForm) {
    const emailInput = newsLetterForm.querySelector('input[type="email"]');
    if (emailInput) {
      emailInput.setAttribute('aria-label', 'Email address for newsletter subscription');
    }
  }
}

// Improve filter button accessibility
function setupFilterButtonAccessibility() {
  const filterBtns = document.querySelectorAll('.filter-btn, .menu-filter');

  filterBtns.forEach(btn => {
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        btn.click();
      }
    });
  });
}

// Setup cart sidebar keyboard accessibility and focus trapping
function setupCartSidebarKeyboardNav() {
  const cartSidebar = document.getElementById('cart-sidebar');
  const cartCloseBtn = document.getElementById('cart-close');

  if (!cartSidebar) return;

  cartSidebar.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      cartSidebar.setAttribute('aria-hidden', 'true');
      cartSidebar.classList.remove('open');
      const cartOpenBtn = document.getElementById('cart-open-btn');
      if (cartOpenBtn) cartOpenBtn.focus();
    }

    if (e.key === 'Tab') {
      const focusable = cartSidebar.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex="0"]');
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          last.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    }
  });

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class') {
        const isOpen = cartSidebar.classList.contains('open');
        if (isOpen && cartCloseBtn) {
          setTimeout(() => cartCloseBtn.focus(), 50);
        }
      }
    });
  });
  observer.observe(cartSidebar, { attributes: true });
}

// Enhance checkbox and radio accessibility
function setupCheckboxAccessibility() {
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');

  checkboxes.forEach(checkbox => {
    const label = document.querySelector(`label[for="${checkbox.id}"]`);
    if (label && !checkbox.getAttribute('aria-label')) {
      checkbox.setAttribute('aria-label', label.textContent.trim());
    }
  });
}

// Setup range slider accessibility
function setupRangeSliderAccessibility() {
  const sliders = document.querySelectorAll('input[type="range"]');

  sliders.forEach(slider => {
    const label = document.querySelector(`label[for="${slider.id}"]`);
    if (label) {
      slider.setAttribute('aria-label', label.textContent.trim());
    }
  });
}

// Enhance select element accessibility
function setupSelectAccessibility() {
  const selects = document.querySelectorAll('select');

  selects.forEach(select => {
    const label = document.querySelector(`label[for="${select.id}"]`);
    if (label && !select.getAttribute('aria-label')) {
      select.setAttribute('aria-label', label.textContent.trim());
    }
  });
}

// Improve button and link focus management
function setupFocusVisibility() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      document.body.classList.add('keyboard-nav');
    }
  });

  document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-nav');
  });
}

// Initialize all accessibility enhancements
function initializeAccessibility() {
  setupSkipLinks();
  setupMobileNavigation();
  setupDropdownKeyboardNav();
  setupSearchKeyboardNav();
  setupCardKeyboardNav();
  setupFormAccessibility();
  setupFilterButtonAccessibility();
  setupCartSidebarKeyboardNav();
  setupCheckboxAccessibility();
  setupRangeSliderAccessibility();
  setupSelectAccessibility();
  setupFocusVisibility();
}

// Run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAccessibility);
} else {
  initializeAccessibility();
}
