// Minimal Google Maps Places type declarations
declare namespace google.maps.places {
  class AutocompleteService {
    getPlacePredictions(
      request: AutocompletionRequest,
      callback: (
        predictions: AutocompletePrediction[] | null,
        status: PlacesServiceStatus,
      ) => void,
    ): void;
  }

  class AutocompleteSessionToken {}

  class PlacesService {
    constructor(attrContainer: HTMLElement);
    getDetails(
      request: PlaceDetailsRequest,
      callback: (place: PlaceResult | null, status: PlacesServiceStatus) => void,
    ): void;
  }

  interface AutocompletionRequest {
    input: string;
    types?: string[];
    componentRestrictions?: { country: string | string[] };
    sessionToken?: AutocompleteSessionToken;
  }

  interface AutocompletePrediction {
    place_id: string;
    description: string;
    structured_formatting: {
      main_text: string;
      secondary_text: string;
    };
  }

  interface PlaceDetailsRequest {
    placeId: string;
    fields?: string[];
    sessionToken?: AutocompleteSessionToken;
  }

  interface PlaceResult {
    address_components?: AddressComponent[];
    formatted_address?: string;
  }

  interface AddressComponent {
    long_name: string;
    short_name: string;
    types: string[];
  }

  enum PlacesServiceStatus {
    OK = 'OK',
    ZERO_RESULTS = 'ZERO_RESULTS',
    ERROR = 'ERROR',
  }
}

interface ImportMetaEnv {
  readonly VITE_GOOGLE_PLACES_API_KEY?: string;
}
