'use strict';

// Set the initiative's progress percentage from 0 to 100.
const progressPercent = 50;

const total = document.querySelector('#total');
const updated = document.querySelector('#updated');
if (typeof progressPercent === 'number' && Number.isFinite(progressPercent) && progressPercent >= 0 && progressPercent <= 100) {
  total.textContent = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(progressPercent);
  updated.textContent = 'Updated by our team';
} else {
  updated.textContent = 'Progress is temporarily unavailable';
  console.error('progressPercent must be a number from 0 to 100.');
}

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
