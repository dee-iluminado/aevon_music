export interface DownloadLink {
  quality: string;
  url: string;
}

export interface Song {
  id: string;
  title: string;
  album: string;
  albumId?: string;
  artists: string[];
  image: string;
  imageSizes: Record<string, string>;
  duration: number;
  language?: string;
  year?: string;
  downloadUrl: DownloadLink[];
  mediaUrl: string;
  previewUrl?: string;
  hasLyrics?: boolean;
  url?: string;
  playCount?: number;
  explicitContent?: boolean;
}

export interface Album {
  id: string;
  name: string;
  image: string;
  imageSizes: Record<string, string>;
  artists: string[];
  year?: string;
  language?: string;
  songCount?: number;
  description?: string;
  url?: string;
  type?: string;
  songs?: Song[];
}

export interface Playlist {
  id: string;
  name: string;
  image: string;
  imageSizes: Record<string, string>;
  subtitle?: string;
  songCount?: number;
  followerCount?: number;
  language?: string;
  url?: string;
  type?: string;
  songs?: Song[];
}

export interface ArtistInfo {
  id: string;
  name: string;
  image: string;
  imageSizes: Record<string, string>;
  url?: string;
  type?: string;
}

export interface Lyrics {
  id: string;
  lyrics: string;
  lines?: string[];
  snippet?: string;
  copyright?: string;
  synced?: { time: number; text: string }[];
}
