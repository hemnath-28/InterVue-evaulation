const navbar = document.querySelector(".navbar");
const menuButton = document.querySelector(".menu-btn");
const navLinks = document.querySelectorAll(".nav-links a");

menuButton?.addEventListener("click", () => {
  const isOpen = navbar.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(isOpen));
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    navbar.classList.remove("open");
    menuButton?.setAttribute("aria-expanded", "false");
  });
});

const revealItems = document.querySelectorAll(".reveal");
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

revealItems.forEach((item) => revealObserver.observe(item));
