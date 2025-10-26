export interface ParkAsset {
  id: string; // Firebase key
  assetName: string;
  assetType: string;
  status: string;
  description: string;
  acquisitionDate: string;
  imageUrl: string; // URL from Firebase Storage
  latitude: number | null;
  longitude: number | null;
}
