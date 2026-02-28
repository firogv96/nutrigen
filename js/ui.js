window.UI = {
    zoomLevel: 1,
    
    init: function() {
        this.themeToggle = document.getElementById('theme-toggle');
        this.infoBtn = document.getElementById('info-btn');
        this.infoModal = document.getElementById('info-modal');
        this.closeInfoBtn = document.getElementById('close-info-btn');
        
        this.previewBtn = document.getElementById('preview-btn');
        this.fullscreenModal = document.getElementById('fullscreen-modal');
        this.closeFullscreenBtns = document.querySelectorAll('.close-fullscreen-btn');
        
        this.zoomInBtn = document.getElementById('zoom-in');
        this.zoomOutBtn = document.getElementById('zoom-out');
        this.zoomLabel = document.getElementById('zoom-level');
        this.labelNode = document.getElementById('nutrition-label');
        
        this.collapseSidebarBtn = document.getElementById('collapse-sidebar');
        this.expandSidebarBtn = document.getElementById('expand-sidebar');
        
        this.bindEvents();
        this.initToggles();
        this.initTheme();
        this.initCustomSelects();
        this.initNumberInputs();
    },
    
    initNumberInputs: function() {
        const numberInputs = document.querySelectorAll('input[type="number"]');
        
        numberInputs.forEach(input => {
            if (input.parentElement.classList.contains('number-input-wrapper')) return;
            
            const wrapper = document.createElement('div');
            wrapper.className = 'number-input-wrapper';
            input.parentNode.insertBefore(wrapper, input);
            wrapper.appendChild(input);
            
            const controls = document.createElement('div');
            controls.className = 'number-controls';
            controls.innerHTML = `
                <button type="button" class="num-btn up" tabindex="-1">
                    <i class="ti ti-chevron-up"></i>
                </button>
                <button type="button" class="num-btn down" tabindex="-1">
                    <i class="ti ti-chevron-down"></i>
                </button>
            `;
            wrapper.appendChild(controls);
            
            const upBtn = controls.querySelector('.up');
            const downBtn = controls.querySelector('.down');
            
            const handleStep = (direction) => {
                if (direction === 'up') input.stepUp();
                else input.stepDown();
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
            };

            upBtn.addEventListener('click', (e) => { e.preventDefault(); handleStep('up'); });
            downBtn.addEventListener('click', (e) => { e.preventDefault(); handleStep('down'); });

            // Hold to repeat
            let interval;
            const startPress = (dir) => {
                handleStep(dir);
                interval = setInterval(() => handleStep(dir), 100);
            };
            const stopPress = () => clearInterval(interval);

            [upBtn, downBtn].forEach(btn => {
                const dir = btn.classList.contains('up') ? 'up' : 'down';
                btn.addEventListener('mousedown', (e) => {
                    if (e.button !== 0) return;
                    interval = setTimeout(() => startPress(dir), 400);
                });
                btn.addEventListener('mouseup', stopPress);
                btn.addEventListener('mouseleave', stopPress);
            });
        });
    },

    initCustomSelects: function() {
        const containers = document.querySelectorAll('.custom-select-container');
        
        containers.forEach(container => {
            const trigger = container.querySelector('.custom-select-trigger');
            const options = container.querySelectorAll('.custom-option');
            const targetId = container.getAttribute('data-target');
            
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                // Close others
                containers.forEach(c => {
                    if (c !== container) c.classList.remove('open');
                });
                container.classList.toggle('open');
            });
            
            options.forEach(option => {
                option.addEventListener('click', (e) => {
                    const value = option.getAttribute('data-value');
                    
                    // Update Flag if exists (both in option and trigger)
                    const optionFlag = option.querySelector('.fi');
                    const triggerFlag = container.querySelector('.fi');
                    if (optionFlag && triggerFlag) {
                        triggerFlag.className = optionFlag.className;
                    }

                    // Update Text
                    // Try to find a span that isn't the flag, or specifically marked
                    const optionTextEl = option.querySelector('[data-i18n]') || option.querySelector('span:last-child');
                    const triggerTextEl = trigger.querySelector('[data-i18n]') || trigger.querySelector('span:nth-last-child(2)');
                    
                    if (optionTextEl && triggerTextEl) {
                        triggerTextEl.textContent = optionTextEl.textContent;
                        if (optionTextEl.hasAttribute('data-i18n')) {
                            triggerTextEl.setAttribute('data-i18n', optionTextEl.getAttribute('data-i18n'));
                        } else {
                            triggerTextEl.removeAttribute('data-i18n');
                        }
                    }
                    
                    // Update selection state
                    options.forEach(opt => opt.classList.remove('selected'));
                    option.classList.add('selected');
                    
                    // Sync with hidden select
                    if (targetId) {
                        const hiddenSelect = document.getElementById(targetId);
                        if (hiddenSelect) {
                            hiddenSelect.value = value;
                            hiddenSelect.dispatchEvent(new Event('change', { bubbles: true }));
                            hiddenSelect.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                    }
                    
                    container.classList.remove('open');
                });
            });
        });
        
        document.addEventListener('click', () => {
            containers.forEach(c => c.classList.remove('open'));
        });
    },
    
    syncCustomSelect: function(targetId) {
        const container = document.querySelector(`.custom-select-container[data-target="${targetId}"]`);
        if (!container) return;
        
        const hiddenSelect = document.getElementById(targetId);
        if (!hiddenSelect) return;
        
        const val = hiddenSelect.value;
        const option = container.querySelector(`.custom-option[data-value="${val}"]`);
        if (!option) return;
        
        const trigger = container.querySelector('.custom-select-trigger');
        
        // Update Flag
        const optionFlag = option.querySelector('.fi');
        const triggerFlag = container.querySelector('.fi');
        if (optionFlag && triggerFlag) {
            triggerFlag.className = optionFlag.className;
        }

        // Update Text
        const optionTextEl = option.querySelector('[data-i18n]') || option.querySelector('span:last-child');
        const triggerTextEl = trigger.querySelector('[data-i18n]') || trigger.querySelector('span:nth-last-child(2)');
        
        if (optionTextEl && triggerTextEl) {
            triggerTextEl.textContent = optionTextEl.textContent;
            if (optionTextEl.hasAttribute('data-i18n')) {
                triggerTextEl.setAttribute('data-i18n', optionTextEl.getAttribute('data-i18n'));
            } else {
                triggerTextEl.removeAttribute('data-i18n');
            }
        }
        
        // Update selection state
        container.querySelectorAll('.custom-option').forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
    },
    
    initTheme: function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        this.themeToggle.innerHTML = currentTheme === 'dark' ? '<i class="ti ti-sun"></i>' : '<i class="ti ti-moon"></i>';
    },
    
    bindEvents: function() {
        // Theme
        this.themeToggle.addEventListener('click', () => {
            let html = document.documentElement;
            let currentTheme = html.getAttribute('data-theme');
            let newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            this.themeToggle.innerHTML = newTheme === 'dark' ? '<i class="ti ti-sun"></i>' : '<i class="ti ti-moon"></i>';
        });
        
        // Modals
        this.infoBtn.addEventListener('click', () => this.infoModal.showModal());
        this.closeInfoBtn.addEventListener('click', () => this.infoModal.close());
        this.infoModal.addEventListener('click', (e) => {
            if (e.target === this.infoModal) this.infoModal.close();
        });
        
        // Fullscreen
        this.previewBtn.addEventListener('click', () => {
            let body = this.fullscreenModal.querySelector('.fullscreen-body');
            body.innerHTML = '';
            
            // Clone the label and zoom it up
            let clone = this.labelNode.cloneNode(true);
            clone.style.transform = 'scale(2)';
            clone.style.transformOrigin = 'top center';
            clone.style.margin = '40px auto';
            
            body.appendChild(clone);
            this.fullscreenModal.showModal();
        });
        
        this.closeFullscreenBtns.forEach(btn => {
            btn.addEventListener('click', () => this.fullscreenModal.close());
        });
        
        this.fullscreenModal.addEventListener('click', (e) => {
            if (e.target === this.fullscreenModal) this.fullscreenModal.close();
        });
        
        // Zoom
        this.zoomInBtn.addEventListener('click', () => {
            if (this.zoomLevel < 3) this.zoomLevel += 0.25;
            this.updateZoom();
        });
        
        this.zoomOutBtn.addEventListener('click', () => {
            if (this.zoomLevel > 0.5) this.zoomLevel -= 0.25;
            this.updateZoom();
        });

        // Sidebar Collapse
        this.collapseSidebarBtn.addEventListener('click', () => {
            document.body.classList.add('sidebar-collapsed');
        });

        this.expandSidebarBtn.addEventListener('click', () => {
            document.body.classList.remove('sidebar-collapsed');
        });
    },
    
    updateZoom: function() {
        if (!this.labelNode) return;
        this.zoomLabel.textContent = Math.round(this.zoomLevel * 100) + '%';
        this.labelNode.style.transform = `scale(${this.zoomLevel})`;
    },
    
    initToggles: function() {
        document.querySelectorAll('.section-header').forEach(header => {
            header.addEventListener('click', () => {
                header.parentElement.classList.toggle('open');
            });
        });
    }
};
