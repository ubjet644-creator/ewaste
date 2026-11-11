'use strict';

const total = document.querySelector('#total');
const updated = document.querySelector('#updated');
const hostDialog = document.querySelector('#host-dialog');
const hostForm = document.querySelector('#host-form');
const kilograms = document.querySelector('#kilograms');
const password = document.querySelector('#password');
const message = document.querySelector('#form-message');

function showTotal(data) {
  total.textContent = data.kilograms === null ? '—' : new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(data.kilograms);
  updated.textContent = data.updatedAt
    ? `Updated ${new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(data.updatedAt))}`
    : 'Our first update is coming soon';
  kilograms.value = data.kilograms === null ? '' : data.kilograms;
}

async function loadTotal() {
  try {
    const response = await fetch('/api/total', { cache: 'no-store' });
    if (!response.ok) throw new Error('The server could not load the total.');
    showTotal(await response.json());
  } catch (error) {
    total.textContent = '—';
    updated.textContent = 'Unable to load progress. Please refresh.';
    console.error(error);
  }
}

document.querySelector('#host-open').addEventListener('click', () => {
  message.textContent = '';
  password.value = '';
  hostDialog.showModal();
});
document.querySelector('#host-close').addEventListener('click', () => hostDialog.close());
hostDialog.addEventListener('close', () => { password.value = ''; });

hostForm.addEventListener('submit', async event => {
  event.preventDefault();
  const submit = hostForm.querySelector('button[type="submit"]');
  submit.disabled = true;
  message.textContent = 'Saving…';
  try {
    const response = await fetch('/api/total', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kilograms: Number(kilograms.value), password: password.value })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Could not save progress.');
    showTotal(data);
    password.value = '';
    message.textContent = 'Progress saved and shared!';
  } catch (error) {
    message.textContent = error.message || 'Could not save progress. Please try again.';
  } finally {
    submit.disabled = false;
  }
});

const creditDialog = document.querySelector('#credit-dialog');
let secretClicks = 0;
document.querySelector('#secret').addEventListener('click', () => {
  secretClicks++;
  if (secretClicks === 7) {
    secretClicks = 0;
    creditDialog.showModal();
  }
});
document.querySelector('#credit-close').addEventListener('click', () => creditDialog.close());

loadTotal();
