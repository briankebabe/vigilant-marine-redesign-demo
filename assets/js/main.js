(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  // Mobile navigation
  const menuButton = $('.menu-toggle');
  const nav = $('.nav-links');
  if (menuButton && nav) {
    menuButton.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('is-open');
      menuButton.setAttribute('aria-expanded', String(isOpen));
      menuButton.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
      menuButton.innerHTML = isOpen ? '<svg class="icon icon-menu" viewBox="0 0 24 24" aria-hidden="true"><use href="#close"></use></svg>' : '<svg class="icon icon-menu" viewBox="0 0 24 24" aria-hidden="true"><use href="#menu"></use></svg>';
    });
    $$('.nav-links a').forEach(link => link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.innerHTML = '<svg class="icon icon-menu" viewBox="0 0 24 24" aria-hidden="true"><use href="#menu"></use></svg>';
    }));
  }

  // Header depth cue
  const header = $('.site-header');
  const handleScroll = () => header?.classList.toggle('is-scrolled', window.scrollY > 8);
  handleScroll();
  window.addEventListener('scroll', handleScroll, { passive: true });

  // Reveal on scroll; keep content visible if observers are unavailable.
  const revealItems = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -25px 0px' });
    revealItems.forEach(item => observer.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add('is-visible'));
  }

  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  // Small, accessible status toast
  const toast = $('.toast');
  let toastTimer;
  const showToast = message => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2600);
  };

  // Product catalogue filtering
  const productGrid = $('#product-grid');
  if (productGrid) {
    let active = 'all';
    const search = $('#product-search');
    const filter = () => {
      const term = (search?.value || '').trim().toLowerCase();
      $$('.product-card', productGrid).forEach(card => {
        const categoryOk = active === 'all' || card.dataset.category === active;
        const textOk = !term || card.textContent.toLowerCase().includes(term);
        card.hidden = !(categoryOk && textOk);
      });
    };
    $$('[data-filter]').forEach(button => button.addEventListener('click', () => {
      active = button.dataset.filter;
      $$('[data-filter]').forEach(item => item.classList.toggle('is-active', item === button));
      filter();
    }));
    search?.addEventListener('input', filter);
  }

  // Enquiry-list demo. This is deliberately not a checkout or server submission.
  const CART_KEY = 'vigilant-demo-enquiry-list';
  const getCart = () => {
    try {
      const value = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      return Array.isArray(value) ? value.filter(item => typeof item === 'string') : [];
    } catch { return []; }
  };
  const saveCart = items => {
    try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch { /* storage may be disabled */ }
  };
  const updateCartCount = () => {
    const count = getCart().length;
    $$('[data-enquiry-count]').forEach(el => { el.textContent = count; });
    $$('.add-enquiry').forEach(button => {
      const name = button.closest('[data-product]')?.dataset.product;
      const added = name && getCart().includes(name);
      button.innerHTML = added ? '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><use href="#check"></use></svg><span>Added</span>' : '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><use href="#plus"></use></svg><span>Add</span>';
      button.classList.toggle('btn-outline-dark', Boolean(added));
    });
  };
  $$('.add-enquiry').forEach(button => button.addEventListener('click', () => {
    const card = button.closest('[data-product]');
    const name = card?.dataset.product;
    if (!name) return;
    const items = getCart();
    if (items.includes(name)) {
      showToast('This product is already in your enquiry list.');
    } else {
      items.push(name);
      saveCart(items);
      showToast(`${name} added to your enquiry list.`);
    }
    updateCartCount();
  }));

  // Product-page links can preselect a product in the store demo.
  const params = new URLSearchParams(window.location.search);
  const requestedProduct = params.get('product');
  if (requestedProduct && $('#store-grid')) {
    const matching = $$('#store-grid [data-product]').find(card =>
      card.dataset.product.toLowerCase() === requestedProduct.toLowerCase() ||
      card.dataset.product.toLowerCase().includes(requestedProduct.toLowerCase()) ||
      requestedProduct.toLowerCase().includes(card.dataset.product.toLowerCase())
    );
    if (matching) {
      const items = getCart();
      if (!items.includes(matching.dataset.product)) items.push(matching.dataset.product);
      saveCart(items);
      matching.scrollIntoView({ behavior: 'smooth', block: 'center' });
      showToast(`${matching.dataset.product} added to your enquiry list.`);
    }
  }
  updateCartCount();

  const dock = $('#enquiry-dock');
  dock?.addEventListener('click', event => {
    event.preventDefault();
    const items = getCart();
    if (!items.length) {
      showToast('Add one or more products to start an enquiry.');
      return;
    }
    const body = [
      'Hello Vigilant Sales Team,',
      '',
      'I would like more information and a quotation for the following products:',
      ...items.map(item => `• ${item}`),
      '',
      'Please let me know the available configurations, current pricing and lead times.',
      '',
      'Thank you.'
    ].join('\n');
    window.location.href = `mailto:sales@vigilantmarine.com?subject=${encodeURIComponent('Product enquiry — Vigilant Marine Systems')}&body=${encodeURIComponent(body)}`;
  });

  // Store search and category filters
  const storeGrid = $('#store-grid');
  if (storeGrid) {
    let active = 'all';
    const search = $('#store-search');
    const filter = () => {
      const term = (search?.value || '').trim().toLowerCase();
      $$('[data-product]', storeGrid).forEach(card => {
        const categoryOk = active === 'all' || card.dataset.category === active;
        const textOk = !term || (card.textContent + ' ' + card.dataset.product).toLowerCase().includes(term);
        card.hidden = !(categoryOk && textOk);
      });
    };
    $$('[data-store-filter]').forEach(button => button.addEventListener('click', () => {
      active = button.dataset.storeFilter;
      $$('[data-store-filter]').forEach(item => item.classList.toggle('is-active', item === button));
      filter();
    }));
    search?.addEventListener('input', filter);
  }

  // Contact form opens a pre-filled email. Nothing is uploaded or stored.
  const contactForm = $('#contact-form');
  if (contactForm) {
    const topicParam = params.get('topic');
    if (topicParam) {
      const topicField = $('#contact-topic');
      const messageField = $('#contact-message');
      if (topicField) topicField.value = topicParam;
      if (messageField) messageField.value = `I would like information about: ${topicParam}.\n\n`;
    }
    contactForm.addEventListener('submit', event => {
      event.preventDefault();
      if (!contactForm.reportValidity()) return;
      const data = new FormData(contactForm);
      const name = data.get('name') || '';
      const company = data.get('company') || '';
      const email = data.get('email') || '';
      const topic = data.get('topic') || 'General enquiry';
      const message = data.get('message') || '';
      const recipient = /service/i.test(topic) ? 'service@vigilantmarine.com' : (/order|tracking/i.test(topic) ? 'cs@vigilantmarine.com' : (/sales|product/i.test(topic) ? 'sales@vigilantmarine.com' : 'info@vigilantmarine.com'));
      const body = `Name: ${name}\nCompany: ${company}\nEmail: ${email}\nEnquiry type: ${topic}\n\n${message}`;
      window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(`${topic} — Website enquiry`)}&body=${encodeURIComponent(body)}`;
    });
  }
})();
