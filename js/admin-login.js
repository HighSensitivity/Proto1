document.addEventListener('DOMContentLoaded', function() {
    // Default credentials
    const DEFAULT_USERNAME = 'admin';
    const DEFAULT_PASSWORD = 'password123';

    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    const togglePassword = document.querySelector('.toggle-password');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.querySelector('.login-btn');

    // Toggle password visibility
    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    });

    // Clear error message when user starts typing
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', () => {
            errorMessage.textContent = '';
        });
    });

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const password = passwordInput.value;

        // Add loading state
        loginBtn.classList.add('loading');
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (username === DEFAULT_USERNAME && password === DEFAULT_PASSWORD) {
            errorMessage.textContent = '';
            sessionStorage.setItem('adminAuthenticated', 'true');
            
            // Success animation
            loginBtn.innerHTML = '<i class="fas fa-check"></i>';
            await new Promise(resolve => setTimeout(resolve, 500));
            
            window.location.href = 'admin.html';
        } else {
            errorMessage.textContent = 'Invalid username or password';
            loginBtn.classList.remove('loading');
            
            // Shake animation for error
            loginForm.classList.add('shake');
            setTimeout(() => loginForm.classList.remove('shake'), 500);
        }
    });
}); 