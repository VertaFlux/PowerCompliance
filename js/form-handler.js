/**
 * Discovery Form Handler
 * Handles form submission and sends data to backend API
 */

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('discoveryForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
});

async function handleFormSubmit(event) {
    event.preventDefault();
    
    const formData = {
        companyName: document.getElementById('companyName').value.trim(),
        companyUrl: document.getElementById('companyUrl').value.trim(),
        challenge: document.getElementById('challenge').value.trim(),
        teamSize: document.getElementById('teamSize').value.trim(),
        budget: document.getElementById('budget').value.trim(),
        email: document.getElementById('email').value.trim()
    };

    const messageDiv = document.getElementById('formMessage');

    // --- FRONT-END VALIDATION ---
    
    // Regular expression to check for a basic valid email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
        messageDiv.textContent = 'Please enter a valid email address.';
        messageDiv.classList.add('error');
        messageDiv.classList.remove('success');
        return; // Stop the function here, do not fetch
    }

    // Try-catch block to validate URL structure
    try {
        new URL(formData.companyUrl);
    } catch (_) {
        messageDiv.textContent = 'Please enter a valid URL (including http:// or https://)';
        messageDiv.classList.add('error');
        messageDiv.classList.remove('success');
        return; // Stop the function here, do not fetch
    }

    // ----------------------------------------

    try {
        // Send to your backend API
        const response = await fetch('/api/discovery-leads', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            // Success - show message
            messageDiv.textContent = 'Thank you! We\'ll be in touch within 1 business day.';
            messageDiv.classList.add('success');
            messageDiv.classList.remove('error');
            messageDiv.style.display = 'block'; // Ensure it is visible
            
            // Reset form
            document.getElementById('discoveryForm').reset();
            
            // Hide message after 5 seconds
            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 5000);
        } else {
            // Read error message from backend if available
            const errorData = await response.json();
            throw new Error(errorData.error || 'Form submission failed');
        }
    } catch (error) {
        // Error - show message
        messageDiv.textContent = error.message || 'Error submitting form. Please try again or email directly.';
        messageDiv.classList.add('error');
        messageDiv.classList.remove('success');
        messageDiv.style.display = 'block';
        console.error('Form error:', error);
    }
}