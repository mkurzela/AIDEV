export interface UserData {
  id: number;
  name: string;
}

export interface GPSLocation {
  code: number;
  message: {
    lat: number;
    lon: number;
  };
}

export interface GPSResponse {
  [name: string]: GPSLocation;
}

export interface PlaceData {
  name: string;
  users: string[];
  message?: string;
}

export interface APIResponse {
  code: number;
  message: string;
  data?: any;
}
