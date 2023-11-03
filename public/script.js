document.addEventListener('DOMContentLoaded', () => {
    const addEventForm = document.getElementById('add-event-form');
    const eventList = document.querySelector('.event-list');
  
    addEventForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(addEventForm);
      const response = await fetch('/events', {
        method: 'POST',
        body: formData,
      });
      if (response.status === 200) {
        updateEventList();
        addEventForm.reset();
      }
    });     
  
    eventList.addEventListener('click', async (e) => {
      if (e.target.classList.contains('delete-button')) {
        const eventId = e.target.getAttribute('data-id');
        const response = await fetch(`/events/${eventId}`, { method: 'DELETE' });
        if (response.status === 200) {
          updateEventList();
        }
      }
    });
  
    async function updateEventList() {
      const response = await fetch('/');
      const html = await response.text();
      eventList.innerHTML = html;
    }
  });
  