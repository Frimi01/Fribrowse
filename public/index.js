//Github (buy me coffee on kofi): https://github.com/Frimi01/Frimi01-Projects
const sidebar = document.querySelector(".sidebar");
const resizer = document.querySelector(".resizer");
let isResizing = false;

resizer.addEventListener("mousedown", (event) => {
  isResizing = true;
  event.preventDefault(); // Prevents text selection

  // Get sidebar's initial position
  const sidebarRect = sidebar.getBoundingClientRect();
  const startMouse = event.clientX;
  const startWidth = sidebarRect.width;

  function resizeSidebar(moveEvent) {
    if (!isResizing) return;

    requestAnimationFrame(() => {
      let newWidth = startWidth + (moveEvent.clientX - startMouse) - 20;
      sidebar.style.width = `${newWidth}px`;
    });
  }

  function stopResizing() {
    isResizing = false;
    document.removeEventListener("mousemove", resizeSidebar);
    document.removeEventListener("mouseup", stopResizing);
  }

  document.addEventListener("mousemove", resizeSidebar);
  document.addEventListener("mouseup", stopResizing);
});
