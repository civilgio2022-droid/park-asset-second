// Fix: Export the ParkAsset interface to make it available for import.
export interface ParkAsset {
  id: string;
  assetName: string;
  assetType: string;
  status: string;
  description: string;
  photoURL: string;
  mapURL: string;
  latitude: number;
  longitude: number;
  registrationDate: string;
}
