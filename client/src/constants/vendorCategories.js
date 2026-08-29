export const VENDOR_CATEGORIES = [
  { value: 'caterer', label: 'Caterer', description: 'Provides food and beverage services, often offering a range of menu options that can be customized to the event.' },
  { value: 'photographer_videographer', label: 'Photographer/Videographer', description: 'Captures photos and videos of the event, documenting key moments and details for lasting memories.' },
  { value: 'venue', label: 'Venue', description: 'The location where the event will take place. This could range from banquet halls to outdoor gardens or conference centers.' },
  { value: 'florist', label: 'Florist', description: 'Designs floral arrangements, centerpieces, and other decorative pieces using fresh flowers, greenery, and plants.' },
  { value: 'dj_band_musicians', label: 'DJ/Band/Musicians', description: 'Provides music and entertainment, either as a live band, solo musicians, or a DJ to keep the party going.' },
  { value: 'decorator_event_designer', label: 'Decorator/Event Designer', description: 'Responsible for the visual aesthetics, including lighting, furniture, drapery, and overall event design.' },
  { value: 'lighting_sound_technician', label: 'Lighting and Sound Technician', description: 'Provides and manages professional lighting and sound systems, enhancing ambiance and ensuring smooth audio.' },
  { value: 'rental_company', label: 'Rental Company', description: 'Supplies rental items such as chairs, tables, linens, tents, and décor elements like arches or lighting fixtures.' },
  { value: 'cake_dessert_vendor', label: 'Cake/Dessert Vendor', description: "Creates custom cakes, cupcakes, dessert bars, and sweet treats tailored to your event's theme and dietary needs." },
  { value: 'stationery_designer_printer', label: 'Stationery Designer/Printer', description: 'Designs and prints event invitations, programs, menus, place cards, and other printed materials.' },
  { value: 'transportation_services', label: 'Transportation Services', description: 'Provides shuttles, limos, or other transportation options for guests to travel to and from the event safely.' },
  { value: 'hair_makeup_artists', label: 'Hair & Makeup Artists', description: 'Provides professional hair and makeup services for the bride, groom, or special guests.' },
  { value: 'officiant', label: 'Officiant', description: 'A professional who officiates the ceremony, legally binding the marriage or presiding over other formal rites.' },
  { value: 'photo_booth_provider', label: 'Photo Booth Provider', description: 'Provides a photo booth setup with props for guests to take fun, memorable pictures throughout the event.' },
  { value: 'bartending_service', label: 'Bartending Service', description: 'Professional bartenders who provide drink services, often offering customized cocktails for the event.' },
  { value: 'event_security', label: 'Event Security', description: 'Ensures the safety of guests and event space, managing crowd control, guest lists, and overall security.' },
  { value: 'entertainment', label: 'Entertainment', description: 'Provides specialized entertainment such as magicians, comedians, dancers, or performers to engage and entertain guests.' },
  { value: 'other', label: 'Others', description: 'Vendors not listed previously — specify your own category.' }
];

export const getCategoryLabel = (value) => {
  const found = VENDOR_CATEGORIES.find((c) => c.value === value);
  return found ? found.label : value;
};

export const getCategoryDescription = (value) => {
  const found = VENDOR_CATEGORIES.find((c) => c.value === value);
  return found ? found.description : '';
};