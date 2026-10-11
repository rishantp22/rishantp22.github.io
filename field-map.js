// The field log is always available, including when the optional map cannot load.
const locations = [
  { id: 'ajeetgarh', name: 'Ajeetgarh', region: 'Rajasthan', group: 'india', date: 'DECEMBER 2019 · INDIA', coordinates: [27.42, 75.75], tag: 'PRECAMBRIAN MAPPING', description: 'Mapping Precambrian rocks, basal Alwar Group cross-bedding, and the sequence of structural deformation.' },
  { id: 'dehradun', name: 'Dehradun–Mussoorie', region: 'Uttarakhand', group: 'india', date: 'SEPTEMBER 2018 · INDIA', coordinates: [30.32, 78.03], tag: 'HIMALAYAN STRUCTURES', description: 'Structural and sedimentological field training around the Himalayan Frontal Thrust, Main Boundary Thrust, and Ganga–Yamuna drainage divide.' },
  { id: 'varanasi', name: 'Varanasi & Vindhyan region', region: 'Uttar Pradesh', group: 'india', date: 'MARCH 2018 · INDIA', coordinates: [25.32, 82.97], tag: 'STRATIGRAPHY & STROMATOLITES', description: 'Semri and Rewa formation rock sampling, sedimentary structures, and stromatolites in Sulkan Valley. Marker: Varanasi regional reference, not an individual outcrop.' },
  { id: 'nainital', name: 'Nainital', region: 'Uttarakhand', group: 'india', date: 'DECEMBER 2016 · INDIA', coordinates: [29.39, 79.45], tag: 'KROL & TAL FORMATIONS', description: 'Investigating the geological setting of Nainital Lake and the structures and sedimentology of the Krol and Tal formations.' },
  { id: 'meteor-crater', name: 'Meteor Crater', region: 'Near Flagstaff, Arizona', group: 'arizona', date: 'SEPTEMBER 2023 · USA', coordinates: [35.027, -111.023], tag: 'IMPACT GEOLOGY', description: 'The Arizona “Holey Tour”: examining overturned strata at Meteor Crater and connecting terrestrial field observations with the record of a meteorite impact.' },
  { id: 'sunset-crater', name: 'Sunset Crater', region: 'Near Flagstaff, Arizona', group: 'arizona', date: 'SEPTEMBER 2023 · SAME ARIZONA TRIP', coordinates: [35.365, -111.503], tag: 'VOLCANIC LANDFORMS', description: 'Studying the volcanic landscape and ʻaʻā lava flows around Sunset Crater, as part of the same Arizona field trip.' }
];

const regionLabels = { india: 'India', arizona: 'Arizona' };
const mapContainer = document.querySelector('#field-map');

function initializeMap() {
  if (!mapContainer || !window.L || mapContainer.dataset.ready) return;
  mapContainer.dataset.ready = 'true';
  const L = window.L;
  mapContainer.replaceChildren();
  const map = L.map(mapContainer, { scrollWheelZoom: false, zoomControl: true, attributionControl: true });
  const status = document.querySelector('#map-status');
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 17,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
  }).on('tileerror', () => {
    status.textContent = 'Some map tiles could not load. All field notes remain available below.';
  }).addTo(map);

  let activeRegion = 'india';
  const markers = new Map();
  const iconFor = (index, selected) => L.divIcon({
    className: `field-marker-icon${selected ? ' is-selected' : ''}`,
    html: `<span>${String(index + 1).padStart(2, '0')}</span>`,
    iconSize: [30, 30], iconAnchor: [15, 15], tooltipAnchor: [17, 0]
  });

  function selectLocation(id, announce = true) {
    const entry = locations.find(location => location.id === id);
    if (!entry) return;
    if (entry.group !== activeRegion) setRegion(entry.group, false);
    document.querySelector('#map-reading-date').textContent = entry.date;
    document.querySelector('#map-reading-title').textContent = entry.name;
    document.querySelector('#map-reading-region').textContent = entry.region;
    document.querySelector('#map-reading-description').textContent = entry.description;
    document.querySelector('#map-reading-tag').textContent = entry.tag;
    document.querySelector('#map-reading-link').href = `#${entry.id}`;
    for (const [index, location] of locations.entries()) {
      const selected = location.id === id;
      markers.get(location.id).setIcon(iconFor(index, selected));
      const element = markers.get(location.id).getElement();
      if (element) {
        element.setAttribute('role', 'button');
        element.setAttribute('aria-label', `${location.name}, ${location.region}`);
        element.setAttribute('aria-pressed', String(selected));
        element.dataset.fieldMarker = location.id;
      }
      document.querySelector(`[data-location-card="${location.id}"]`).classList.toggle('is-selected', selected);
      const button = document.querySelector(`[data-field-location="${location.id}"]`);
      button.setAttribute('aria-pressed', String(selected));
      button.textContent = selected ? 'Selected on map ✓' : 'Locate on map ↗';
    }
    if (announce) status.textContent = `Showing ${entry.name}.`;
  }

  function setRegion(region, selectFirst = true) {
    activeRegion = region;
    const groupLocations = locations.filter(location => location.group === region);
    for (const location of locations) {
      const marker = markers.get(location.id);
      if (location.group === region) marker.addTo(map);
      else map.removeLayer(marker);
    }
    map.fitBounds(L.latLngBounds(groupLocations.map(location => location.coordinates)), { padding: [40, 40], maxZoom: region === 'arizona' ? 9 : 6, animate: false });
    document.querySelectorAll('[data-map-region]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.mapRegion === region));
    });
    mapContainer.setAttribute('aria-label', `Interactive map of geological field trips in ${regionLabels[region]}`);
    if (selectFirst) selectLocation(groupLocations[0].id);
  }

  for (const [index, location] of locations.entries()) {
    const marker = L.marker(location.coordinates, {
      icon: iconFor(index, false), title: `${location.name}, ${location.region}`,
      alt: location.name, keyboard: true, riseOnHover: true
    }).bindTooltip(location.name).addTo(map);
    marker.on('click', () => selectLocation(location.id));
    markers.set(location.id, marker);
  }
  // Handle both activation keys explicitly across Leaflet/browser versions.
  mapContainer.addEventListener('keydown', event => {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    const markerElement = event.target.closest('.field-marker-icon');
    if (!markerElement) return;
    event.preventDefault();
    event.stopPropagation();
    selectLocation(markerElement.dataset.fieldMarker);
  }, true);
  document.querySelector('#map-regions').hidden = false;
  document.querySelectorAll('[data-map-region]').forEach(button => {
    button.addEventListener('click', () => setRegion(button.dataset.mapRegion));
  });
  document.querySelectorAll('[data-field-location]').forEach(button => {
    button.hidden = false;
    button.addEventListener('click', () => {
      selectLocation(button.dataset.fieldLocation);
      document.querySelector('.atlas-toolbar').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    });
  });
  setRegion('india', false);
  selectLocation('ajeetgarh', false);
}

if (mapContainer) {
  if (window.L) initializeMap();
  else document.querySelector('#leaflet-library')?.addEventListener('load', initializeMap, { once: true });
}

// Each method is a parallel area of experience, not a stage in one recipe.
const methodControls = document.querySelector('#method-selectors');
if (methodControls) {
  const buttons = [...methodControls.querySelectorAll('[data-method]')];
  const panels = [...document.querySelectorAll('[data-method-panel]')];
  function selectMethod(id) {
    if (!panels.some(panel => panel.dataset.methodPanel === id)) return;
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.method === id)));
    panels.forEach(panel => { panel.hidden = panel.dataset.methodPanel !== id; });
  }
  buttons.forEach(button => button.addEventListener('click', () => selectMethod(button.dataset.method)));
  methodControls.hidden = false;
  const initialMethod = window.location.hash.replace('#method-', '');
  selectMethod(panels.some(panel => panel.dataset.methodPanel === initialMethod) ? initialMethod : 'digestion');
}
