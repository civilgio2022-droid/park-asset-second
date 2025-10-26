
export interface ParkAsset {
  id: string;
  name: string;
  type: string;
  registrationDate: string; // ISO string format
  photo: string; // Base64 data URL
  mapView: string; // Placeholder image URL
  latitude: number | null;
  longitude: number | null;
  condition: '좋음' | '보통' | '나쁨';
  description: string;
}

export type Stage = 'register' | 'inquiry' | 'report';
