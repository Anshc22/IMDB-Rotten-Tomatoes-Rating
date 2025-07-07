// Utility to fetch and cache ratings with max 3 retries
async function getRatings(title) {
  const maxRetries = 3;
  let attempt = 0;
  let lastError = null;
  while (attempt < maxRetries) {
    try {
      // Check cache first
      const cached = await new Promise((resolve) => {
        chrome.storage.local.get([title], (result) => resolve(result[title]));
      });
      if (cached) return cached;
      // Get API key
      const apiKey = await new Promise((resolve) => {
        chrome.storage.sync.get('omdbApiKey', (data) => resolve(data.omdbApiKey));
      });
      if (!apiKey) return null;
      const url = `https://www.omdbapi.com/?apikey=${apiKey}&t=${encodeURIComponent(title)}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.Response === "True") {
        const imdb = json.imdbRating && json.imdbRating !== "N/A" ? json.imdbRating : '--';
        const rt = (json.Ratings.find(r => r.Source === "Rotten Tomatoes") || {}).Value;
        const rottenTomatoes = rt && rt !== "N/A" ? rt : '--';
        const ratings = { imdb, rt: rottenTomatoes, imdbID: json.imdbID };
        chrome.storage.local.set({ [title]: ratings });
        return ratings;
      } else {
        return { imdb: '--', rt: '--', imdbID: null }; // Return default if no response
      }
    } catch (err) {
      lastError = err;
      // Exponential backoff
      await new Promise(res => setTimeout(res, 300 * Math.pow(2, attempt)));
      attempt++;
    }
  }
  // If all retries fail, return null
  return { imdb: '--', rt: '--', imdbID: null }; // Return default if all retries fail
}

// --- Custom Range Logic ---
let imdbRanges = null;
let rtRanges = null;
let rangesLoaded = false;

function loadCustomRanges() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['imdbRanges', 'rtRanges'], (data) => {
      imdbRanges = Array.isArray(data.imdbRanges) && data.imdbRanges.length ? data.imdbRanges : [
        {min:8, max:10, color:'#28cd41'},
        {min:6.6, max:7.9, color:'#86c5e8'},
        {min:4.5, max:6.5, color:'#ffff54'},
        {min:0, max:4.4, color:'red'}
      ];
      rtRanges = Array.isArray(data.rtRanges) && data.rtRanges.length ? data.rtRanges : [
        {min:80, max:100, color:'#28cd41'},
        {min:66, max:79, color:'#86c5e8'},
        {min:45, max:65, color:'#ffff54'},
        {min:0, max:44, color:'red'}
      ];
      rangesLoaded = true;
      resolve();
    });
  });
}

function getColorFromRanges(value, ranges) {
  for (const r of ranges) {
    if (value >= r.min && value <= r.max) return r.color;
  }
  return 'gray';
}

function getBorderFillColor(ratingValue, label) {
  if (!ratingValue || typeof ratingValue !== 'string') return 'white';
  let value = parseFloat(ratingValue.replace('%', ''));
  if (ratingValue === '--') {
    return 'white';
  }
  if (!rangesLoaded) {
    // fallback to defaults if not loaded yet
    if (label === 'IMDB') {
      if (value >= 8.0 && value <= 10) return '#28cd41';
      if (value >= 6.6 && value <= 7.9) return '#86c5e8';
      if (value >= 4.5 && value <= 6.5) return '#ffff54';
      if (value >= 0 && value <= 4.4) return '#ff0000';
    } else if (label === 'Rotten Tomatoes') {
      if (value >= 80 && value <= 100) return '#28cd41';
      if (value >= 66 && value <= 79) return '#86c5e8';
      if (value >= 45 && value <= 65) return '#ffff54';
      if (value >= 0 && value <= 44) return '#ff0000';
    }
    return 'gray';
  }
  if (label === 'IMDB') {
    return getColorFromRanges(value, imdbRanges);
  } else if (label === 'Rotten Tomatoes') {
    return getColorFromRanges(value, rtRanges);
  }
  return 'gray';
}
// --- End Custom Range Logic ---

// Function to get border fill percentage
function getBorderFillPercentage(ratingValue, label) {
    if (!ratingValue || typeof ratingValue !== 'string') return 15;
    if (ratingValue === '--') return 15; // For unavailable ratings
    let value = parseFloat(ratingValue.replace('%', ''));
    if (label === 'IMDB') {
        return (value / 10) * 100; // Scale 0-10 to 0-100%
    } else if (label === 'Rotten Tomatoes') {
        return value; // Already 0-100%
    }
    return 0; // Default
}

// Create rating circle (no icon), with dynamic sizing based on parentWidth
function createRatingCircle(value, label, parentWidth, sizeMultiplier = 1) {
  const circle = document.createElement('div');
  circle.className = 'hotstar-rating-circle'; // This is the main outer circle element

  // Calculate dynamic size for the overall circle (outer diameter)
  const baseSize = parentWidth * 0.15 * sizeMultiplier; // Apply sizeMultiplier here
  circle.style.width = `${baseSize}px`;
  circle.style.height = `${baseSize}px`;

  // Font size for the main rating text will be applied to the span directly
  circle.style.fontSize = `${baseSize * 0.35}px`;

  const displayValue = (value === '--') ? '?' : value;
  
  const text = document.createElement('span');
  text.className = 'hotstar-rating-value';

  // Determine fill color for the border and the font
  const fillColor = getBorderFillColor(value, label);

  // Set text content and color dynamically based on rating and label
  if (value === '--') {
      text.textContent = displayValue; // Set to '?'
      text.style.color = 'white'; // Changed to white for '?'
  } else if (label === 'Rotten Tomatoes') {
    let rtValue = '';
    let showPercent = true;
    if (typeof value === 'string') {
      if (value === '--' || value.trim() === '') {
        rtValue = '?';
        showPercent = false;
      } else {
        rtValue = value.replace('%', '');
      }
    } else if (typeof value === 'number') {
      rtValue = value.toString();
    } else {
      rtValue = '?';
      showPercent = false;
    }
    text.textContent = rtValue;
    if (showPercent) {
      const percentSymbol = document.createElement('span');
      percentSymbol.textContent = '%';
      percentSymbol.className = 'percent-symbol';
      text.appendChild(percentSymbol);
    }
    text.style.color = fillColor;
  } else { // IMDB ratings
      text.textContent = displayValue;
      text.style.color = fillColor; // Font color matches border fill color
  }

  // Determine fill percentage for the outer conic gradient
  const fillPercentage = getBorderFillPercentage(value, label);

  // Set the conic-gradient for the OUTER ring's background via CSS variable
  // The unfilled part of the border is now explicitly gray
  circle.style.setProperty('--circle-outer-gradient', `conic-gradient(${fillColor} 0% ${fillPercentage}%, gray ${fillPercentage}% 100%)`);

  circle.appendChild(text); // Append the text span to the circle

  circle.title = label; // Tooltip for the whole circle

  return circle;
}

// Helper: process in batches
async function processInBatches(items, batchSize, processFn) {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await Promise.all(batch.map(processFn));
  }
}

// Debounce function to limit how often a function is called
function debounce(func, delay) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
}

// Inject ratings (limit to 25 at a time, top to bottom)
async function injectRatings() {
  let elementsToProcess = [];
  const hostname = window.location.hostname;

  // Determine size multiplier based on hostname
  let currentSizeMultiplier = 1; // Default size
  if (hostname.includes('hotstar.com') || hostname.includes('hulu.com') || hostname.includes('zee5.com') || hostname.includes('crunchyroll.com')) {
    currentSizeMultiplier = 1.5; // Double size for Hotstar, Hulu, Peacock TV, Zee5, and Sony Liv
  }
  if (hostname.includes('sonyliv.com')) {
    currentSizeMultiplier = 1.8;
  }
  if (hostname.includes('peacocktv.com')) {
    currentSizeMultiplier = 1.4;
  }
  if (hostname.includes('primevideo.com')) {
    currentSizeMultiplier = 1.1;
  }
  if (hostname.includes('netflix.com')) {
    currentSizeMultiplier = 1.1;
  }
  if (hostname.includes('tv.apple.com')) {
    currentSizeMultiplier = 1.05;
  }


  // Selectors for different platforms
  if (hostname.includes('hotstar.com')) {
    const imgs = Array.from(document.querySelectorAll('span > img[alt]'));
    elementsToProcess = imgs.map(img => ({
      element: img,
      title: img.alt.trim(),
      parentToAttach: img.closest('div[style*="aspect-ratio"]') || img.parentElement
    }));
  } else if (hostname.includes('netflix.com')) {
    const netflixCards = Array.from(document.querySelectorAll('.title-card-container .title-card'));
    elementsToProcess = netflixCards.map(card => {
      const titleLink = card.querySelector('a[aria-label]');
      return {
        element: titleLink,
        title: titleLink ? titleLink.getAttribute('aria-label') : null,
        parentToAttach: card
      };
    }).filter(item => item.title);
  } else if (hostname.includes('primevideo.com')) {
    const primeVideoCards = Array.from(document.querySelectorAll('article[data-card-title]'));
    elementsToProcess = primeVideoCards.map(card => ({
      element: card,
      title: card.dataset.cardTitle.trim(),
      parentToAttach: card
    }));
  } else if (hostname.includes('hulu.com')) {
    const huluTiles = Array.from(document.querySelectorAll('.Tile.cu-tile'));
    elementsToProcess = huluTiles.map(tile => {
      const titleElement = tile.querySelector('.Tile__title-link > span');
      return {
        element: titleElement,
        title: titleElement ? titleElement.textContent.trim() : null,
        parentToAttach: tile
      };
    }).filter(item => item.title);
  } else if (hostname.includes('peacocktv.com')) {
    const peacockTiles = Array.from(document.querySelectorAll('.filtered-carousel-tile-styles__FilteredCarouselTile-sc-3cce3d65-1'));
    elementsToProcess = peacockTiles.map(tile => {
      const img = tile.querySelector('img[alt]');
      return {
        element: img,
        title: img ? img.alt.trim() : null,
        parentToAttach: tile
      };
    }).filter(item => item.title);
  } else if (hostname.includes('crunchyroll.com')) {
    // UPDATED Crunchyroll selector: More direct targeting of title link
    const crunchyrollTitles = Array.from(document.querySelectorAll('.browse-card__title-link--SLlRM, .card-title, .title-text'));
    elementsToProcess = crunchyrollTitles.map(titleEl => {
      const parentCard = titleEl.closest('.browse-card--esJdT, .series-card, .episode-card'); // Find closest parent card
      return {
        element: titleEl, // The title element itself
        title: titleEl.textContent.trim(),
        parentToAttach: parentCard // Attach to the closest parent card
      };
    }).filter(item => item.title && item.parentToAttach);
  } else if (hostname.includes('zee5.com')) {
    // UPDATED Zee5 selector: Target movieCard, prefer popupTitle if available, fallback to img alt/title
    const zee5Cards = Array.from(document.querySelectorAll('.movieCard'));
    elementsToProcess = zee5Cards.map(card => {
      const popupTitle = card.querySelector('.popupTitle span') ? card.querySelector('.popupTitle span').textContent.trim() : null;
      const img = card.querySelector('img[alt], img[title]');
      const imgTitle = (img ? (img.alt || img.title || '') : '').replace(/ Movie$/, '').trim();
      
      const title = popupTitle || imgTitle; // Prefer popup title, fallback to img
      
      return {
        element: card,
        title: title,
        parentToAttach: card
      };
    }).filter(item => item.title);
  } else if (hostname.includes('sonyliv.com')) {
    // UPDATED Sony Liv selector: Target outer-card, extract title from its title attribute or inner text
    const sonylivCards = Array.from(document.querySelectorAll('.out.outer-card[title], .card.portrait-card'));
    elementsToProcess = sonylivCards.map(card => {
      const titleAttr = card.getAttribute('title') || '';
      const innerText = card.querySelector('.title-text') ? card.querySelector('.title-text').textContent.trim() : ''; // If there's a specific title text element
      
      const title = (titleAttr || innerText).replace(/ Season \d+$/, '').trim();
      
      return {
        element: card,
        title: title,
        parentToAttach: card
      };
    }).filter(item => item.title);
  } else if (hostname.includes('tv.apple.com')) {
      const appleTvLockups = Array.from(document.querySelectorAll('.lockup.svelte-hxwt2x'));
      elementsToProcess = appleTvLockups.map(lockup => {
          const titleElement = lockup.querySelector('.lockup-caption .title.svelte-hxwt2x');
          return {
              element: titleElement,
              title: titleElement ? titleElement.textContent.trim() : null,
              parentToAttach: lockup.querySelector('.lockup-figure.svelte-hxwt2x')
          };
      }).filter(item => item.title && item.parentToAttach);
  }


  const filteredElements = elementsToProcess.filter(item => {
    const parent = item.parentToAttach;
    // Check if parent exists, if it doesn't already have a rating container, and if it's a valid element node
    return parent && !parent.querySelector('.hotstar-rating-container') && parent.nodeType === 1;
  });

  await processInBatches(filteredElements, 100, async (item) => {
    await new Promise(res => setTimeout(res, 500));

    const parent = item.parentToAttach;
    const title = item.title;

    if (!parent || parent.querySelector('.hotstar-rating-container') || parent.nodeType !== 1) {
      return;
    }

    const parentWidth = parent.offsetWidth;
    if (parentWidth === 0) return;

    const ratings = await getRatings(title);
    // If no ratings or the title is just a placeholder, don't inject
    if (!ratings || (ratings.imdb === '--' && ratings.rt === '--')) {
        return;
    }

    const container = document.createElement('div');
    container.className = 'hotstar-rating-container';
    container.dataset.movieTitle = title; // Store title for Rotten Tomatoes search

    container.style.gap = `${parentWidth * 0.015}px`;

    container.appendChild(createRatingCircle(ratings.imdb, 'IMDB', parentWidth, currentSizeMultiplier));
    container.appendChild(createRatingCircle(ratings.rt, 'Rotten Tomatoes', parentWidth, currentSizeMultiplier));

    if (parent && getComputedStyle(parent).position === 'static') {
      parent.style.position = 'relative';
    }
    if (parent) {
      parent.appendChild(container);
    }
  });
}

// In injectRatings, before any rating rendering, ensure ranges are loaded
const debouncedInjectRatings = debounce(async function() {
  if (!rangesLoaded) await loadCustomRanges();
  injectRatings();
}, 300);

const observer = new MutationObserver(debouncedInjectRatings);
observer.observe(document.body, { childList: true, subtree: true });

debouncedInjectRatings();
