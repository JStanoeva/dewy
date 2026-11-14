import { randomUUID } from 'expo-crypto';
import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { supabase } from '@/lib/supabase';

const bucket = 'product-photos';
// A square crop at 960 gives 960×960: small to upload, sharp on Details, and read whole by Claude in 3.1b.
const photoWidth = 960;
const signedUrlSeconds = 60 * 60;

export type PhotoSource = 'camera' | 'library';

export type PickedPhoto = {
  uri: string;
  width: number;
  height: number;
};

export class CameraPermissionError extends Error {}

// Null when the user cancels; the picker keeps PNG or HEIC sources, so every photo is re-saved as a JPEG.
export async function pickProductPhoto(source: PhotoSource): Promise<PickedPhoto | null> {
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: 'images',
    allowsEditing: true,
    // Square loses the least when the photo fills the wide Shelf tile and the Details hero.
    aspect: [1, 1],
  };
  let result: ImagePicker.ImagePickerResult;
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      throw new CameraPermissionError();
    }
    result = await ImagePicker.launchCameraAsync(options);
  } else {
    result = await ImagePicker.launchImageLibraryAsync(options);
  }
  if (result.canceled) {
    return null;
  }

  const asset = result.assets[0];
  const context = ImageManipulator.manipulate(asset.uri);
  // The picker can report 0 when it doesn't know the size, so resize then too.
  if (asset.width === 0 || asset.width > photoWidth) {
    context.resize({ width: photoWidth });
  }
  try {
    const image = await context.renderAsync();
    try {
      const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 });
      return { uri: saved.uri, width: saved.width, height: saved.height };
    } finally {
      image.release();
    }
  } finally {
    context.release();
  }
}

// Returns the new object path; every upload gets a fresh name, so nothing is ever overwritten.
export async function uploadProductPhoto(localUri: string): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) {
    throw new Error('Not signed in');
  }
  // fetch(fileUri).arrayBuffer() returned 14 bytes on RN 0.88, so the file is read directly.
  const body = await new File(localUri).arrayBuffer();
  if (body.byteLength < 100) {
    throw new Error('The photo file could not be read');
  }
  const path = `${userId}/${randomUUID()}.jpg`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, body, { contentType: 'image/jpeg', upsert: false });
  if (error) {
    throw error;
  }
  return path;
}

export async function getPhotoUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, signedUrlSeconds);
  if (error) {
    throw error;
  }
  return data.signedUrl;
}

// Best effort and not awaited: a file left behind is harmless, so it never fails a save or a delete.
export function removeProductPhoto(path: string) {
  supabase.storage
    .from(bucket)
    .remove([path])
    .catch(() => undefined);
}
