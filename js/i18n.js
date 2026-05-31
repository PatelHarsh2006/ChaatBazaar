let currentLang = localStorage.getItem('chaatLang') || 'en';

function t(key) {
  return (translations[currentLang] && translations[currentLang][key])
    || (translations['en'] && translations['en'][key]) || key;
}

function applyTranslations() {
  const navHome = document.querySelector('a[href="#hero"].nav-link');
  if (navHome) navHome.textContent = t('nav_home');

  const navAbout = document.querySelector('a[href="#about"].nav-link');
  if (navAbout) navAbout.textContent = t('nav_about');

  const navOrders = document.querySelector('a[href="orders.html"].nav-link');
  if (navOrders) navOrders.textContent = t('nav_orders');

  const dropdownToggle = document.querySelector('.dropdown-toggle');
  if (dropdownToggle) dropdownToggle.textContent = t('nav_menu');

  const menuFilterLinks = document.querySelectorAll('.dropdown-menu .menu-filter');
  menuFilterLinks.forEach(link => {
    const keyMap = { Specials: 'nav_specials', Snacks: 'nav_snacks', Chaat: 'nav_chaat', Beverages: 'nav_beverages', All: 'nav_all' };
    if (keyMap[link.dataset.filter]) link.textContent = t(keyMap[link.dataset.filter]);
  });

  const cartOpenBtn = document.getElementById('cart-open-btn');
  if (cartOpenBtn) {
    const cartText = cartOpenBtn.querySelector('.cart-text');
    if (cartText) {
      cartText.textContent = t('nav_cart');
    } else {
      const count = document.getElementById('cart-count')?.textContent || '0';
      cartOpenBtn.innerHTML = `${t('nav_cart')} (<span id="cart-count">${count}</span>)`;
    }
  }

  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.placeholder = t('search_placeholder');

  const heroTitle = document.querySelector('.hero-content h1');
  if (heroTitle) heroTitle.textContent = t('hero_title');

  const heroSubtitle = document.querySelector('.hero-content p');
  if (heroSubtitle) heroSubtitle.textContent = t('hero_subtitle');

  const orderNowBtn = document.getElementById('order-now-btn');
  if (orderNowBtn) orderNowBtn.textContent = t('hero_btn');

  const specialsTitle = document.querySelector('#specials .section-title');
  if (specialsTitle) specialsTitle.textContent = t('specials_title');

  const menuTitle = document.querySelector('#menu .section-title');
  if (menuTitle) menuTitle.textContent = t('menu_title');

  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    const keyMap = { All: 'filter_all', Snacks: 'filter_snacks', Chaat: 'filter_chaat', Beverages: 'filter_beverages' };
    if (keyMap[btn.dataset.filter]) btn.textContent = t(keyMap[btn.dataset.filter]);
  });

  const filterToggleBtn = document.getElementById('filter-toggle-btn');
  if (filterToggleBtn) {
    const span = filterToggleBtn.querySelector('span');
    if (span) span.textContent = t('advanced_filters');
  }

  const spiceLabel = document.querySelector('label[for="spice-level-select"]');
  if (spiceLabel) spiceLabel.textContent = t('spice_level');

  const spiceSelect = document.getElementById('spice-level-select');
  if (spiceSelect) {
    const spiceMap = ['spice_all', 'spice_low', 'spice_medium', 'spice_high'];
    [...spiceSelect.options].forEach((opt, i) => { if (spiceMap[i]) opt.textContent = t(spiceMap[i]); });
  }

  const ratingLabel = document.querySelector('label[for="rating-select"]');
  if (ratingLabel) ratingLabel.textContent = t('min_rating');

  const ratingSelect = document.getElementById('rating-select');
  if (ratingSelect) {
    const ratingMap = ['rating_all', 'rating_46', 'rating_48', 'rating_49'];
    [...ratingSelect.options].forEach((opt, i) => { if (ratingMap[i]) opt.textContent = t(ratingMap[i]); });
  }

  const dietaryLabels = document.querySelectorAll('.checkbox-label');
  if (dietaryLabels[0]) dietaryLabels[0].textContent = t('dietary_vegan');
  if (dietaryLabels[1]) dietaryLabels[1].textContent = t('dietary_gf');

  const dietaryGroupLabel = document.querySelector('.dietary-group > label');
  if (dietaryGroupLabel) dietaryGroupLabel.textContent = t('dietary_prefs');

  const resetBtn = document.getElementById('reset-filters-btn');
  if (resetBtn) resetBtn.textContent = t('reset_filters');

  const allH2s = document.querySelectorAll('#about h2');
  if (allH2s[0]) allH2s[0].textContent = t('about_title');
  if (allH2s[1]) allH2s[1].textContent = t('contact_title');

  const teamMembers = document.querySelectorAll('.team-member p');
  if (teamMembers[0]) teamMembers[0].textContent = t('priya_role');
  if (teamMembers[1]) teamMembers[1].textContent = t('anjali_role');

  const labelName = document.querySelector('label[for="name"]');
  if (labelName) labelName.innerHTML = `${t('label_name')} <span class="required">*</span>`;

  const labelEmail = document.querySelector('label[for="email"]');
  if (labelEmail) labelEmail.innerHTML = `${t('label_email')} <span class="required">*</span>`;

  const labelMessage = document.querySelector('label[for="message"]');
  if (labelMessage) labelMessage.innerHTML = `${t('label_message')} <span class="required">*</span>`;

  const sendBtn = document.querySelector('.btn-submit');
  if (sendBtn) sendBtn.textContent = t('btn_send');

  const testimonialsTitle = document.querySelector('.testimonials .section-title');
  if (testimonialsTitle) testimonialsTitle.textContent = t('testimonials_title');

  const newsletterTitle = document.querySelector('.newsletter h2');
  if (newsletterTitle) newsletterTitle.textContent = t('newsletter_title');

  const newsletterDesc = document.querySelector('.newsletter p');
  if (newsletterDesc) newsletterDesc.textContent = t('newsletter_desc');

  const newsletterEmail = document.getElementById('newsletter-email');
  if (newsletterEmail) newsletterEmail.placeholder = t('newsletter_placeholder');

  const newsletterBtn = document.querySelector('.newsletter-form button');
  if (newsletterBtn) newsletterBtn.textContent = t('newsletter_btn');

  const cartHeader = document.getElementById('cart-header');
  if (cartHeader) {
    const closeBtn = document.getElementById('cart-close');
    cartHeader.innerHTML = `${t('cart_title')} ${closeBtn ? closeBtn.outerHTML : ''}`;
  }

  const checkoutBtn = document.getElementById('checkout-btn');
  if (checkoutBtn) checkoutBtn.textContent = t('cart_checkout');

  const footerP = document.querySelector('footer p');
  if (footerP) footerP.textContent = t('footer_copy');

  const langToggle = document.getElementById('lang-toggle-btn');
  if (langToggle) langToggle.textContent = t('lang_toggle');

  document.documentElement.lang = currentLang;
}

function switchLanguage() {
  currentLang = currentLang === 'en' ? 'hi' : 'en';
  localStorage.setItem('chaatLang', currentLang);
  applyTranslations();
}

function initI18n() {
  const nav = document.querySelector('nav');
  if (nav && !document.getElementById('lang-toggle-btn')) {
    const btn = document.createElement('button');
    btn.id = 'lang-toggle-btn';
    btn.className = 'lang-toggle-btn';
    btn.setAttribute('aria-label', 'Toggle Language');
    btn.textContent = currentLang === 'en' ? 'हिंदी' : 'English';
    btn.addEventListener('click', switchLanguage);
    nav.appendChild(btn);
  }
  applyTranslations();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initI18n);
} else {
  initI18n();
}
