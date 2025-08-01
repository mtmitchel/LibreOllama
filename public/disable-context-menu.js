// Disable context menu on calendar events globally
(function() {
  // Add listener as early as possible
  document.addEventListener('contextmenu', function(e) {
    const target = e.target;
    // Check if clicking on calendar event
    if (target && (
      target.closest('.rbc-event') || 
      target.closest('[data-is-task="true"]') ||
      target.classList.contains('rbc-event')
    )) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    }
  }, true);
  
  // Also override the oncontextmenu property
  Object.defineProperty(HTMLElement.prototype, 'oncontextmenu', {
    set: function() { return false; }
  });
})();