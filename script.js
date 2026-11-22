const menuButton = document.querySelector('.menu-btn');
const navLinks = document.querySelector('.nav-links');
menuButton.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
});
document.querySelectorAll('.nav-links a').forEach(link => link.addEventListener('click', () => {
  navLinks.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open navigation');
}));
document.getElementById('year').textContent = new Date().getFullYear();

const goldRate = document.getElementById('gold-rate');
const silverRate = document.getElementById('silver-rate');
const goldNote = document.getElementById('gold-note');
const silverNote = document.getElementById('silver-note');
const refreshButton = document.getElementById('refresh-rates');
const formatter = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
async function refreshRates() {
  refreshButton.disabled = true;
  refreshButton.firstChild.textContent = '… ';
  try {
    const [goldResponse, silverResponse, fxResponse] = await Promise.all([
      fetch('https://api.gold-api.com/price/XAU'),
      fetch('https://api.gold-api.com/price/XAG'),
      fetch('https://open.er-api.com/v6/latest/USD')
    ]);
    if (!goldResponse.ok || !silverResponse.ok || !fxResponse.ok) throw new Error('Market data unavailable');
    const [gold, silver, fx] = await Promise.all([goldResponse.json(), silverResponse.json(), fxResponse.json()]);
    const inr = Number(fx.rates && fx.rates.INR);
    const goldPrice = Number(gold.price) * inr / 31.1034768 * 10;
    const silverPrice = Number(silver.price) * inr / 31.1034768 * 1000;
    if (!Number.isFinite(goldPrice) || !Number.isFinite(silverPrice) || !inr) throw new Error('Invalid market data');
    goldRate.textContent = '₹' + formatter.format(goldPrice);
    silverRate.textContent = '₹' + formatter.format(silverPrice);
    const updated = 'Spot estimate · ' + new Date().toLocaleTimeString('en-IN', {hour:'2-digit',minute:'2-digit'});
    goldNote.textContent = updated;
    silverNote.textContent = updated;
  } catch (error) {
    goldRate.textContent = 'Unavailable';
    silverRate.textContent = 'Unavailable';
    goldNote.textContent = 'Could not retrieve current spot price';
    silverNote.textContent = 'Please enquire for today’s rate';
  } finally {
    refreshButton.disabled = false;
    refreshButton.firstChild.textContent = '↻ ';
  }
}
refreshButton.addEventListener('click', refreshRates);
refreshRates();

const galleryUpload = document.getElementById('gallery-upload');
const galleryGrid = document.getElementById('gallery-grid');
const storageKey = 'ramaJewellersGalleryPreview';
let savedImages = [];
try { savedImages = JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch { savedImages = []; }
function renderGallery() {
  if (!savedImages.length) {
    galleryGrid.innerHTML = '<p class="gallery-empty">Your jewellery photographs will shine here. Add photos to preview them on this device.</p>';
    return;
  }
  galleryGrid.replaceChildren();
  savedImages.forEach((src, index) => {
    const figure = document.createElement('figure');
    const img = document.createElement('img');
    img.src = src;
    img.alt = 'Rama Jewellers gallery preview ' + (index + 1);
    figure.appendChild(img);
    galleryGrid.appendChild(figure);
  });
}
galleryUpload.addEventListener('change', event => {
  const files = [...event.target.files].filter(file => file.type.startsWith('image/'));
  if (!files.length) return;
  Promise.all(files.map(file => new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  }))).then(images => {
    savedImages = savedImages.concat(images.filter(Boolean));
    try {
      localStorage.setItem(storageKey, JSON.stringify(savedImages));
      renderGallery();
    } catch {
      alert('Your browser storage is full. Please choose fewer or smaller images.');
    }
    galleryUpload.value = '';
  });
});
renderGallery();