import { useState, useEffect, useRef, useCallback } from 'react';

interface AddressComponents {
  address: string;
  city: string;
  state: string;
  zip: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSelect: (components: AddressComponents) => void;
  placeholder?: string;
}

interface Prediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

const API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

// Load Google Maps API once
let loadPromise: Promise<void> | null = null;
function loadGoogleMaps(): Promise<void> {
  if (!API_KEY) return Promise.reject('No API key');
  if (window.google?.maps?.places) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject('Failed to load Google Maps');
    document.head.appendChild(script);
  });

  return loadPromise;
}

/** Parse address_components from a Google Place into our fields */
function parsePlace(place: google.maps.places.PlaceResult): AddressComponents {
  const get = (type: string) =>
    place.address_components?.find((c) => c.types.includes(type));

  const streetNumber = get('street_number')?.long_name || '';
  const route = get('route')?.short_name || '';
  const address = streetNumber && route ? `${streetNumber} ${route}` : route || '';

  return {
    address,
    city: get('locality')?.long_name || get('sublocality')?.long_name || '',
    state: get('administrative_area_level_1')?.short_name || '',
    zip: get('postal_code')?.long_name || '',
  };
}

export default function AddressAutocomplete({ value, onChange, onSelect, placeholder }: Props) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [ready, setReady] = useState(false);

  const serviceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const sessionRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const placesRef = useRef<google.maps.places.PlacesService | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Load Google Maps and init services
  useEffect(() => {
    if (!API_KEY) return;

    loadGoogleMaps().then(() => {
      serviceRef.current = new google.maps.places.AutocompleteService();
      sessionRef.current = new google.maps.places.AutocompleteSessionToken();
      placesRef.current = new google.maps.places.PlacesService(
        document.createElement('div'),
      );
      setReady(true);
    }).catch(() => {
      // No autocomplete — user will type manually
    });
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchPredictions = useCallback((input: string) => {
    if (!serviceRef.current || !sessionRef.current || input.length < 3) {
      setPredictions([]);
      return;
    }

    serviceRef.current.getPlacePredictions(
      {
        input,
        types: ['address'],
        componentRestrictions: { country: 'us' },
        sessionToken: sessionRef.current,
      },
      (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          setPredictions(results as unknown as Prediction[]);
          setShowDropdown(true);
          setActiveIndex(-1);
        } else {
          setPredictions([]);
        }
      },
    );
  }, []);

  const handleInputChange = (val: string) => {
    onChange(val);

    if (!ready) return;

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPredictions(val), 250);
  };

  const handleSelect = (prediction: Prediction) => {
    if (!placesRef.current) return;

    placesRef.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ['address_components', 'formatted_address'],
        sessionToken: sessionRef.current!,
      },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          const components = parsePlace(place);
          onChange(components.address);
          onSelect(components);

          // New session token for next search (saves billing)
          sessionRef.current = new google.maps.places.AutocompleteSessionToken();
        }
      },
    );

    setShowDropdown(false);
    setPredictions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || predictions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, predictions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(predictions[activeIndex]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const inputClass = `w-full bg-scout-soot border border-scout-ash rounded-lg px-3 py-2.5 text-scout-bone text-sm
                       focus:outline-none focus:border-scout-mint/50 focus:ring-1 focus:ring-scout-mint/20
                       placeholder:text-scout-flint transition-colors`;

  return (
    <div ref={wrapperRef} className="relative">
      <input
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => predictions.length > 0 && setShowDropdown(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || (ready ? 'Start typing an address...' : 'Enter address')}
        className={inputClass}
        autoComplete="off"
      />

      {showDropdown && predictions.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-scout-carbon border border-scout-ash
                        rounded-lg shadow-2xl shadow-black/50 overflow-hidden animate-fade-in">
          {predictions.map((p, i) => (
            <button
              key={p.place_id}
              onClick={() => handleSelect(p)}
              onMouseEnter={() => setActiveIndex(i)}
              className={`w-full text-left px-4 py-3 flex flex-col gap-0.5 transition-colors
                ${i === activeIndex ? 'bg-scout-ash/60' : 'hover:bg-scout-ash/30'}
                ${i > 0 ? 'border-t border-scout-ash/40' : ''}`}
            >
              <span className="text-sm text-scout-chalk">{p.structured_formatting.main_text}</span>
              <span className="text-[11px] text-scout-drift">{p.structured_formatting.secondary_text}</span>
            </button>
          ))}
          <div className="px-4 py-1.5 border-t border-scout-ash/40 bg-scout-soot/50">
            <span className="text-[9px] text-scout-flint tracking-wider">POWERED BY GOOGLE</span>
          </div>
        </div>
      )}
    </div>
  );
}
