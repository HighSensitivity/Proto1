document.addEventListener('DOMContentLoaded', function() {
    // Handle mobile menu toggle
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.querySelector('.nav-links');

    navToggle.addEventListener('click', function() {
        navLinks.classList.toggle('active');
    });

    // Add animation to service cards on scroll
    const serviceCards = document.querySelectorAll('.service-card');
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    // Add animation class and observe each service card
    serviceCards.forEach((card, index) => {
        card.classList.add('scroll-animation');
        card.style.transitionDelay = `${index * 0.1}s`; // Stagger the animations
        observer.observe(card);
    });

    // Add hover effect to service cards
    serviceCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.classList.add('hover');
        });

        card.addEventListener('mouseleave', function() {
            this.classList.remove('hover');
        });
    });
});
