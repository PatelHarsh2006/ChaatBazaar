// ===== Accessibility Enhancements =====
// Screen reader support, keyboard navigation, and ARIA improvements

// Setup skip links for keyboard navigation
function setupSkipLinks() {
  const skipLink = document.createElement('a');
  skipLink.href = '#main-content';
  skipLink.className = 'skip-link';
  skipLink.textContent = 'Skip to main content';
  document.body.insertBefore(skipLink, document.body.firstChild);
}

// Enhance dropdown keyboard navigation
function setupDropdownKeyboardNav() {
  const dropdowns = document.querySelectorAll('.dropdown');

  dropdowns.forEach(dropdown => {
    const toggle = dropdown.querySelector('.dropdown-toggle');
    const menu = dropdown.querySelector('.dropdown-menu');
    const items = menu ? menu.querySelectorAll('a') : [];

    if (!toggle) return;

    toggle.addEventListener('keydown', (e) => {
      const isOpen = menu && menu.style.display !== 'none';

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        dropdown.classList.toggle('open');
        menu.style.display = isOpen ? 'none' : 'block';
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!isOpen && menu) {
          menu.style.display = 'block';
        }
        if (items.length > 0) items[0].focus();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (menu) menu.style.display = 'none';
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
          if (menu) menu.style.display = 'none';
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
      e.preventDefault();
      if (selectedIndex >= 0) {
        items[selectedIndex].click();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      suggestionsContainer.style.display = 'none';
      selectedIndex = -1;
    }
  });

  const originalShowSuggestions = searchInput._showSuggestions;
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

// Enhance form accessibility with proper labels and error associations
function setupFormAccessibility() {
  const contactForm = document.getElementById('contact-form');
  const newsLetterForm = document.getElementById('newsletter-form');

  if (contactForm) {
    const inputs = contactForm.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      const label = contactForm.querySelector(`label[for="${input.id}"]`);
      const errorMsg = contactForm.querySelector(`#error-${input.id}`);

      if (errorMsg) {
        input.setAttribute('aria-describedby', `error-${input.id}`);
      }
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

// Setup cart sidebar keyboard accessibility
function setupCartSidebarKeyboardNav() {
  const cartSidebar = document.getElementById('cart-sidebar');
  const cartCloseBtn = document.getElementById('cart-close');

  if (!cartSidebar) return;

  // Trap focus within sidebar when open
  cartSidebar.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      cartSidebar.setAttribute('aria-hidden', 'true');
      cartSidebar.classList.remove('open');
    }
  });
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
