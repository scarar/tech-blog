document.addEventListener('DOMContentLoaded', () => {
  // Add smooth scrolling to all links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      document.querySelector(this.getAttribute('href')).scrollIntoView({
        behavior: 'smooth'
      });
    });
  });

  // Simple dark mode toggle (optional)
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
    });
  }
});
