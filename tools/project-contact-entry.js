// Load the unchanged Contact component only when a detail-page entry is used.
let contactModule;
document.addEventListener('click', async event => {
  const trigger = event.target.closest?.('[data-project-contact]');
  if (!trigger || trigger.disabled) return;
  event.preventDefault();
  if (trigger.dataset.contactLoading) return;
  trigger.dataset.contactLoading = 'true';
  trigger.setAttribute('aria-busy', 'true');
  try {
    const module = await (contactModule ||= import('/portfolio-project-contact.js').catch(error => { contactModule = null; throw error; }));
    module.openProjectContact(trigger);
  } catch (error) { console.error('Contact panel could not be opened', error); }
  finally { delete trigger.dataset.contactLoading; trigger.removeAttribute('aria-busy'); }
});
