const menuButton = document.querySelector('.menu-btn');
const navLinks = document.querySelector('.nav-links');
menuButton.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', open);
});
document.querySelectorAll('.nav-links a').forEach(link => link.addEventListener('click', () => {
  navLinks.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
}));

document.getElementById('year').textContent = new Date().getFullYear();

// The live section uses the public gold-api.com endpoint when available.
// If the API is unavailable or has no key, attractive fallback indicative rates remain visible.
const goldRate = document.getElementById('gold-rate');
const silverRate = document.getElementById('silver-rate');
const rateStatus = document.getElementById('rate-status');
const refreshButton = document.getElementById('refresh-rates');

async function refreshRates() {
  refreshButton.textContent = '…';
  try {
    const response = await fetch('https://api.gold-api.com/price/XAU');
    if (!response.ok) throw new Error('Rate service unavailable');
    const data = await response.json();
    const usdGoldOz = Number(data.price);
    const usdInrResponse = await fetch('https://open.er-api.com/v6/latest/USD');
    const usdInrData = await usdInrResponse.json();
    const inrPerUsd = Number(usdInrData.rates?.INR);
    if (!usdGoldOz || !inrPerUsd) throw new Error('Incomplete rate data');
    const gold24Per10g = usdGoldOz * inrPerUsd / 31.1035 * 10;
    goldRate.innerHTML = `₹${Math.round(gold24Per10g).toLocaleString('en-IN')} <small>/ 10g</small>`;

    const silverResponse = await fetch('https://api.gold-api.com/price/XAG');
    if (silverResponse.ok) {
      const silverData = await silverResponse.json();
      const usdSilverOz = Number(silverData.price);
      const silverPerKg = usdSilverOz * inrPerUsd / 31.1035 * 1000;
      silverRate.innerHTML = `₹${Math.round(silverPerKg).toLocaleString('en-IN')} <small>/ kg</small>`;
    }
    rateStatus.textContent = `Updated ${new Date().toLocaleTimeString('en-IN', {hour:'2-digit', minute:'2-digit'})}`;
  } catch (error) {
    rateStatus.textContent = 'Indicative rates · refresh unavailable';
  } finally {
    refreshButton.textContent = '↻';
  }
}
refreshButton.addEventListener('click', refreshRates);
refreshRates();

const galleryUpload = document.getElementById('gallery-upload');
const galleryGrid = document.getElementById('gallery-grid');
const savedImages = JSON.parse(localStorage.getItem('ramaCustomGallery') || '[]');

function renderGallery() {
  if (!savedImages.length) {
    galleryGrid.innerHTML = '<p class="gallery-empty">Add your jewellery photos to showcase custom creations.</p>';
    return;
  }
  galleryGrid.innerHTML = savedImages.map((src, index) => `<figure><img src="${src}" alt="Custom jewellery creation ${index + 1}"></figure>`).join('');
}

galleryUpload.addEventListener('change', event => {
  const files = [...event.target.files];
  if (!files.length) return;
  let remaining = files.length;
  files.forEach(file => {
    if (!file.type.startsWith('image/')) { remaining--; return; }
    const reader = new FileReader();
    reader.onload = () => {
      savedImages.push(reader.result);
      remaining--;
      if (remaining === 0) {
        try {
          localStorage.setItem('ramaCustomGallery', JSON.stringify(savedImages));
        } catch (error) {
          alert('The browser storage limit was reached. Please use fewer or smaller photos.');
        }
        renderGallery();
      }
    };
    reader.readAsDataURL(file);
  });
  galleryUpload.value = '';
});
renderGallery();
