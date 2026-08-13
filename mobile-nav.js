document.addEventListener('DOMContentLoaded', () => {
    const topNav = document.querySelector('.top-nav');
    const toggleBtn = document.querySelector('.mobile-menu-toggle');
    
    if (topNav && toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            topNav.classList.toggle('mobile-expanded');
            
            // Toggle icon between bars and times (close)
            const icon = toggleBtn.querySelector('i');
            if (icon) {
                if (topNav.classList.contains('mobile-expanded')) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-times');
                } else {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });
    }
});
