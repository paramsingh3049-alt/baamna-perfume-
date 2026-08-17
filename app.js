document.addEventListener('DOMContentLoaded', () => {
    
    // Set Current Year in Footer
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // Scroll Fade-in-up animations using Intersection Observer
    const animateOnScroll = () => {
        const fadeElements = document.querySelectorAll('.fade-in-up');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    observer.unobserve(entry.target); // Trigger only once
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        fadeElements.forEach(el => observer.observe(el));
    };
    
    animateOnScroll();

    // Mobile Navigation Toggle
    const menuToggle = document.getElementById('menuToggle');
    const primaryNav = document.getElementById('primaryNav');

    if (menuToggle && primaryNav) {
        menuToggle.addEventListener('click', () => {
            const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
            menuToggle.setAttribute('aria-expanded', !isExpanded);
            primaryNav.classList.toggle('active');
            
            // Hamburger Animation
            menuToggle.classList.toggle('open');
        });

        // Close menu on nav link click
        const navLinks = primaryNav.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                menuToggle.setAttribute('aria-expanded', 'false');
                primaryNav.classList.remove('active');
                menuToggle.classList.remove('open');
            });
        });
    }


    // Phone Country Code Change - Dynamic Placeholder
    const countryCodeSelect = document.getElementById('country-code');
    const phoneInput = document.getElementById('phone');

    const countryPlaceholders = {
        '+91': 'XXXXX XXXXX',
        '+1': '(555) 019-9999',
        '+44': '7700 900000',
        '+971': '50 123 4567',
        '+65': '8123 4567',
        '+61': '412 345 678',
        '+49': '151 23456789',
        '+33': '6 12 34 56 78',
        '+81': '90-1234-5678',
        '+966': '50 123 4567'
    };

    if (countryCodeSelect && phoneInput) {
        countryCodeSelect.addEventListener('change', () => {
            const selectedVal = countryCodeSelect.value;
            phoneInput.placeholder = countryPlaceholders[selectedVal] || 'Phone Number';
        });
    }

    // Form Submission Handling
    const enquiryForm = document.getElementById('enquiryForm');
    const successMessage = document.getElementById('successMessage');

    if (enquiryForm && successMessage) {
        enquiryForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Intercept page reload to make it look premium
            
            const formData = new FormData(enquiryForm);
            const fullPhone = `${formData.get('country_code')} ${formData.get('phone')}`;
            
            const submitBtn = document.getElementById('submitBtn');
            if (submitBtn) {
                submitBtn.textContent = 'TRANSMITTING ENQUIRY...';
                submitBtn.disabled = true;
            }

            try {
                // Initialize Supabase only on form submission
                const supabaseUrl = 'https://lfvlbspcatlnglfcsnap.supabase.co';
                const supabaseKey = 'sb_publishable_rbH2prTMxhMWFmXWYCXYmQ_FmQTsuRa';
                const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

                const { data, error } = await supabase
                    .from('enquiries')
                    .insert([
                        {
                            fullname: formData.get('fullname'),
                            email: formData.get('email'),
                            phone: fullPhone,
                            location: formData.get('location'),
                            contact_method: formData.get('contact_method'),
                            reason: formData.get('reason'),
                            fragrance_direction: formData.get('fragrance_direction'),
                            extra_notes: formData.get('extra_notes')
                        }
                    ]);

                if (error) throw error;

                enquiryForm.classList.add('hidden');
                successMessage.classList.remove('hidden');
                successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } catch (error) {
                console.error('Error submitting enquiry:', error);
                alert('There was an error submitting your enquiry. Please try again.');
                if (submitBtn) {
                    submitBtn.textContent = 'SUBMIT PRIVATE ENQUIRY';
                    submitBtn.disabled = false;
                }
            }
        });
    }


    // House Section Perfume Scroller
    const houseScroller = document.getElementById('houseScroller');
    if (houseScroller) {
        let isDown = false;
        let startX;
        let scrollLeft;
        let autoScrollInterval;

        const startAutoScroll = () => {
            autoScrollInterval = setInterval(() => {
                houseScroller.scrollLeft += 1;
                // Seamless infinite loop - reset when reaching halfway
                if (houseScroller.scrollLeft >= houseScroller.scrollWidth / 2) {
                     houseScroller.scrollLeft = 0;
                }
            }, 25);
        };
        
        startAutoScroll();

        // Pause auto-scroll on interaction
        houseScroller.addEventListener('mouseenter', () => clearInterval(autoScrollInterval));
        houseScroller.addEventListener('mouseleave', startAutoScroll);
        houseScroller.addEventListener('touchstart', () => clearInterval(autoScrollInterval), {passive: true});
        houseScroller.addEventListener('touchend', startAutoScroll, {passive: true});

        // Mouse Drag to Scroll
        houseScroller.addEventListener('mousedown', (e) => {
            isDown = true;
            houseScroller.style.scrollSnapType = 'none'; // smoother drag
            startX = e.pageX - houseScroller.offsetLeft;
            scrollLeft = houseScroller.scrollLeft;
        });
        houseScroller.addEventListener('mouseleave', () => {
            isDown = false;
            houseScroller.style.scrollSnapType = 'x mandatory';
        });
        houseScroller.addEventListener('mouseup', () => {
            isDown = false;
            houseScroller.style.scrollSnapType = 'x mandatory';
        });
        houseScroller.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - houseScroller.offsetLeft;
            const walk = (x - startX) * 2;
            houseScroller.scrollLeft = scrollLeft - walk;
        });
    }
});
