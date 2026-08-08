(() => {
  const toggle = document.querySelector('[data-nav-toggle]');
  const navigation = document.querySelector('[data-nav]');

  if (toggle && navigation) {
    const closeNavigation = () => {
      navigation.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Mở menu');
      document.body.classList.remove('nav-open');
    };

    toggle.addEventListener('click', () => {
      const isOpen = navigation.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
      toggle.setAttribute('aria-label', isOpen ? 'Đóng menu' : 'Mở menu');
      document.body.classList.toggle('nav-open', isOpen);
    });

    navigation.addEventListener('click', (event) => {
      if (event.target.closest('a')) closeNavigation();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeNavigation();
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 900) closeNavigation();
    });
  }

  document.querySelectorAll('[data-password-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      const input = document.getElementById(button.dataset.passwordToggle);
      if (!input) return;

      const isHidden = input.type === 'password';
      input.type = isHidden ? 'text' : 'password';
      button.textContent = isHidden ? 'Ẩn' : 'Hiện';
      button.setAttribute('aria-label', isHidden ? 'Ẩn mật khẩu' : 'Hiện mật khẩu');
    });
  });

  const flash = document.querySelector('[data-flash]');
  const flashClose = document.querySelector('[data-flash-close]');

  if (flash && flashClose) {
    flashClose.addEventListener('click', () => flash.remove());
  }


  const slotForm = document.querySelector('[data-slot-form]');

  if (slotForm) {
    const slotInputs = [...slotForm.querySelectorAll('input[name="slotId"]')];
    const submitButton = slotForm.querySelector('[data-booking-submit]');
    const selectedTime = slotForm.querySelector('[data-selected-time]');
    const selectedPrice = slotForm.querySelector('[data-selected-price]');
    const summary = slotForm.querySelector('[data-selection-summary]');

    const updateSelection = (input) => {
      if (!input) return;
      if (selectedTime) selectedTime.textContent = input.dataset.timeLabel || input.value;
      if (selectedPrice) selectedPrice.textContent = input.dataset.priceLabel || '—';
      if (submitButton) submitButton.disabled = false;
      summary?.classList.add('has-selection');
    };

    slotInputs.forEach((input) => {
      input.addEventListener('change', () => updateSelection(input));
      if (input.checked) updateSelection(input);
    });
  }
})();

// Xác nhận các thao tác nhạy cảm mà không dùng inline JavaScript,
// giúp Content-Security-Policy có thể chặn script nhúng trong HTML.
document.querySelectorAll('form[data-confirm]').forEach((form) => {
  form.addEventListener('submit', (event) => {
    const message = form.dataset.confirm || 'Bạn có chắc chắn muốn tiếp tục?';
    if (!window.confirm(message)) event.preventDefault();
  });
});
