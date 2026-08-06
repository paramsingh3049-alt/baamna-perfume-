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
        enquiryForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Intercept page reload to make it look premium
            
            // Extract and log details for demonstration/validation
            const formData = new FormData(enquiryForm);
            const fullPhone = `${formData.get('country_code')} ${formData.get('phone')}`;
            console.log('BAAMANN enquiry submitted:', {
                name: formData.get('fullname'),
                email: formData.get('email'),
                phone: fullPhone,
                location: formData.get('location'),
                contactMethod: formData.get('contact_method'),
                reason: formData.get('reason'),
                direction: formData.get('fragrance_direction'),
                notes: formData.get('extra_notes')
            });

            // Simulate API submission
            const submitBtn = document.getElementById('submitBtn');
            if (submitBtn) {
                submitBtn.textContent = 'TRANSMITTING ENQUIRY...';
                submitBtn.disabled = true;
            }

            setTimeout(() => {
                enquiryForm.classList.add('hidden');
                successMessage.classList.remove('hidden');
                
                // Scroll into view of success box
                successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 1500);
        });
    }
});
