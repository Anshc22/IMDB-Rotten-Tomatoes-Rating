document.getElementById('saveApiKeyBtn').onclick = function() {
  const key = document.getElementById('apiKey').value.trim();
  const saveBtn = document.getElementById('saveApiKeyBtn');
  
  // Validate API key format first
  if (!key) {
    showAlert('api-alert', 'Please enter an API key.', 'error');
    return;
  }
  
  // Show loading state
  saveBtn.textContent = 'Validating...';
  saveBtn.disabled = true;
  hideAlert('api-alert');
  
  // Test the API key by making a request
  testApiKey(key).then(isValid => {
    if (isValid) {
      chrome.storage.sync.set({ omdbApiKey: key }, () => {
        showAlert('api-alert', 'API Key saved!', 'success', 2000);
        hideAlert('reset-alert');
      });
    } else {
      showAlert('api-alert', 'Invalid API key. Please check your key and try again.', 'error');
    }
  }).catch(error => {
    showAlert('api-alert', 'Error validating API key. Please check your internet connection and try again.', 'error');
  }).finally(() => {
    // Reset button state
    saveBtn.textContent = 'Save';
    saveBtn.disabled = false;
  });
};

// Function to test if the API key is valid
async function testApiKey(apiKey) {
  try {
    const response = await fetch(`https://www.omdbapi.com/?apikey=${apiKey}&t=test&plot=short`);
    const data = await response.json();
    
    // Check if the response indicates an invalid API key
    if (data.Error && (data.Error.includes('Invalid API key') || data.Error.includes('API key'))) {
      return false;
    }
    
    // If we get a response (even if movie not found), the key is valid
    return true;
  } catch (error) {
    console.error('API key validation error:', error);
    return false;
  }
}

chrome.storage.sync.get('omdbApiKey', (data) => {
  if (data.omdbApiKey) document.getElementById('apiKey').value = data.omdbApiKey;
});

// Range customization logic
const imdbRangesDiv = document.getElementById('imdb-ranges');
const rtRangesDiv = document.getElementById('rt-ranges');
const addImdbBtn = document.getElementById('add-imdb-range');
const addRtBtn = document.getElementById('add-rt-range');
const saveRangesBtn = document.getElementById('saveRangesBtn');

const MAX_RANGES = 5;
const IMDB_MIN = 0, IMDB_MAX = 10;
const RT_MIN = 0, RT_MAX = 100;

let imdbRanges = [];
let rtRanges = [];

function toHexColor(color) {
  // Accepts #rrggbb or #rgb, returns #rrggbb, else fallback to #ff0000
  if (typeof color === 'string' && /^#([0-9a-fA-F]{6})$/.test(color)) return color;
  if (typeof color === 'string' && /^#([0-9a-fA-F]{3})$/.test(color)) {
    // Expand #rgb to #rrggbb
    return '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
  }
  return '#ff0000';
}

function renderRanges() {
  imdbRangesDiv.innerHTML = '';
  imdbRanges.forEach((r, i) => {
    imdbRangesDiv.appendChild(createRangeRow(r, i, 'imdb'));
  });
  if (imdbRanges.length >= MAX_RANGES) {
    addImdbBtn.classList.add('fade');
  } else {
    addImdbBtn.classList.remove('fade');
  }
  addImdbBtn.classList.add('add-range-btn');
  addImdbBtn.disabled = imdbRanges.length >= MAX_RANGES;

  rtRangesDiv.innerHTML = '';
  rtRanges.forEach((r, i) => {
    rtRangesDiv.appendChild(createRangeRow(r, i, 'rt'));
  });
  if (rtRanges.length >= MAX_RANGES) {
    addRtBtn.classList.add('fade');
  } else {
    addRtBtn.classList.remove('fade');
  }
  addRtBtn.classList.add('add-range-btn');
  addRtBtn.disabled = rtRanges.length >= MAX_RANGES;
}

function enforceMinMaxAndNumeric(input, min, max, allowDecimal) {
  input.addEventListener('input', function() {
    let val = input.value;
    // Remove non-numeric except dot if allowDecimal
    val = allowDecimal ? val.replace(/[^\d.]/g, '') : val.replace(/\D/g, '');
    // Remove extra dots if allowDecimal
    if (allowDecimal) val = val.replace(/(\..*)\./g, '$1');
    // Prevent negative
    if (val.startsWith('-')) val = val.slice(1);
    // Allow empty string for partial input
    if (val === '') {
      input.value = '';
      return;
    }
    // Don't clamp or modify the value during typing - let user finish their input
    input.value = val;
  });
  
  // Only validate and clamp on blur (when user is done typing)
  input.addEventListener('blur', function() {
    let val = input.value.trim();
    if (val === '') {
      input.value = '';
      return;
    }
    
    // Parse the value
    let num = allowDecimal ? parseFloat(val) : parseInt(val);
    if (isNaN(num)) {
      // If invalid, reset to empty or previous valid value
      input.value = '';
      return;
    }
    
    // Clamp to min/max
    if (num < min) num = min;
    if (num > max) num = max;
    
    // Format the final value
    if (allowDecimal) {
      input.value = num.toFixed(1);
    } else {
      input.value = num.toString();
    }
  });
}

function createRangeRow(range, idx, type) {
  const row = document.createElement('div');
  row.className = 'range-row';
  row.style.display = 'flex';
  row.style.alignItems = 'center';
  row.style.gap = '8px';
  row.style.marginBottom = '8px';
  const safeColor = toHexColor(range.color);
  const step = type === 'imdb' ? '0.1' : '1';
  row.innerHTML = `
    <input type="text" value="${type === 'imdb' ? range.min.toFixed(1) : range.min}" class="min-val" style="width:60px;font-size:1.1em;padding:2px 6px;"> -
    <input type="text" value="${type === 'imdb' ? range.max.toFixed(1) : range.max}" class="max-val" style="width:60px;font-size:1.1em;padding:2px 6px;">
    <input type="color" value="${safeColor}" class="color-val" style="width:36px;height:32px;padding:0;border:none;background:none;">
    <button class="remove-range compact-x-btn" title="Remove">&times;</button>
  `;
  const minInput = row.querySelector('.min-val');
  const maxInput = row.querySelector('.max-val');
  enforceMinMaxAndNumeric(minInput, type==='imdb'?IMDB_MIN:RT_MIN, type==='imdb'?IMDB_MAX:RT_MAX, type==='imdb');
  enforceMinMaxAndNumeric(maxInput, type==='imdb'?IMDB_MIN:RT_MIN, type==='imdb'?IMDB_MAX:RT_MAX, type==='imdb');
  row.querySelector('.remove-range').onclick = () => {
    if(type==='imdb') { imdbRanges.splice(idx,1); } else { rtRanges.splice(idx,1); }
    renderRanges();
  };
  minInput.onchange = (e) => {
    const val = type === 'imdb' ? parseFloat(e.target.value) : parseInt(e.target.value);
    if (!isNaN(val)) {
      range.min = val;
    }
  };
  maxInput.onchange = (e) => {
    const val = type === 'imdb' ? parseFloat(e.target.value) : parseInt(e.target.value);
    if (!isNaN(val)) {
      range.max = val;
    }
  };
  row.querySelector('.color-val').onchange = (e) => {
    range.color = e.target.value;
    renderRanges();
  };
  row.querySelector('.color-val').value = safeColor;
  return row;
}

addImdbBtn.onclick = () => {
  if (imdbRanges.length >= MAX_RANGES) {
    return;
  }
  imdbRanges.push({min: IMDB_MIN, max: IMDB_MAX, color: '#ffffff'});
  renderRanges();
};
addRtBtn.onclick = () => {
  if (rtRanges.length >= MAX_RANGES) {
    return;
  }
  rtRanges.push({min: RT_MIN, max: RT_MAX, color: '#ffffff'});
  renderRanges();
};

function showAlert(id, message, type = 'error', timeout = 0) {
  const el = document.getElementById(id);
  el.textContent = message;
  el.className = 'alert show ' + (type === 'success' ? 'success' : 'error');
  if (timeout > 0) {
    setTimeout(() => {
      el.className = 'alert';
      el.textContent = '';
    }, timeout);
  }
}

function showStackedAlerts(id, messages, type = 'error') {
  const el = document.getElementById(id);
  el.innerHTML = '';
  el.className = 'alert show ' + (type === 'success' ? 'success' : 'error');
  if (Array.isArray(messages)) {
    messages.forEach(msg => {
      const div = document.createElement('div');
      div.textContent = msg;
      el.appendChild(div);
    });
  } else {
    el.textContent = messages;
  }
}

function hideAlert(id) {
  const el = document.getElementById(id);
  el.className = 'alert';
  el.textContent = '';
  el.innerHTML = '';
}

function validateRangesWithDetails(ranges, minAllowed, maxAllowed, label) {
  const errors = [];
  if(ranges.length === 0) errors.push('At least one range required.');
  ranges.forEach((r, i) => {
    if(r.min > r.max) errors.push(`${label} Range ${i+1}: Min (${r.min}) cannot be greater than max (${r.max}).`);
    if(r.min < minAllowed || r.max > maxAllowed) errors.push(`${label} Range ${i+1}: Values must be between ${minAllowed} and ${maxAllowed}.`);
    if(isNaN(r.min) || isNaN(r.max)) errors.push(`${label} Range ${i+1}: Only numbers are allowed.`);
  });
  // Check for overlap/touch, only show for higher-indexed range, use original indices, lower index first
  for(let i=1;i<ranges.length;i++) {
    for(let j=0;j<i;j++) {
      if(ranges[i].min <= ranges[j].max && ranges[i].max >= ranges[j].min) {
        errors.push(`${label} Range ${j+1} and ${label} Range ${i+1} overlap or touch.`);
        break; // Only report once per range
      }
    }
  }
  return errors;
}

saveRangesBtn.onclick = () => {
  // Validate
  const imdbErrs = validateRangesWithDetails(imdbRanges, IMDB_MIN, IMDB_MAX, 'IMDB');
  const rtErrs = validateRangesWithDetails(rtRanges, RT_MIN, RT_MAX, 'RT');
  hideAlert('imdb-alert');
  hideAlert('rt-alert');
  let hasError = false;
  if(imdbErrs.length) {
    showStackedAlerts('imdb-alert', imdbErrs, 'error');
    hasError = true;
  }
  if(rtErrs.length) {
    showStackedAlerts('rt-alert', rtErrs, 'error');
    hasError = true;
  }
  if (hasError) return;
  chrome.storage.sync.set({ imdbRanges, rtRanges }, () => {
    showAlert('api-alert', 'Ranges saved!', 'success', 2000);
    hideAlert('reset-alert');
    // Reload the current tab to refresh visuals
    if (chrome.tabs) {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs && tabs[0] && tabs[0].id) {
          chrome.tabs.reload(tabs[0].id);
        }
      });
    }
  });
};

document.getElementById('resetRangesBtn').onclick = () => {
  imdbRanges = [
    {min:8, max:10, color:'#28cd41'},
    {min:6.6, max:7.9, color:'#86c5e8'},
    {min:4.5, max:6.5, color:'#ffff54'},
    {min:0, max:4.4, color:'#ff0000'}
  ];
  rtRanges = [
    {min:80, max:100, color:'#28cd41'},
    {min:66, max:79, color:'#86c5e8'},
    {min:45, max:65, color:'#ffff54'},
    {min:0, max:44, color:'#ff0000'}
  ];
  renderRanges();
  showAlert('reset-alert', 'Settings Reset', 'success', 2000);
  hideAlert('api-alert');
  hideAlert('imdb-alert');
  hideAlert('rt-alert');
};

function loadRanges() {
  chrome.storage.sync.get(['imdbRanges','rtRanges'], (data) => {
    imdbRanges = Array.isArray(data.imdbRanges) && data.imdbRanges.length ? data.imdbRanges : [
      {min:8, max:10, color:'#28cd41'},
      {min:6.6, max:7.9, color:'#86c5e8'},
      {min:4.5, max:6.5, color:'#ffff54'},
      {min:0, max:4.4, color:'#ff0000'}
    ];
    rtRanges = Array.isArray(data.rtRanges) && data.rtRanges.length ? data.rtRanges : [
      {min:80, max:100, color:'#28cd41'},
      {min:66, max:79, color:'#86c5e8'},
      {min:45, max:65, color:'#ffff54'},
      {min:0, max:44, color:'#ff0000'}
    ];
    renderRanges();
  });
}

loadRanges();
