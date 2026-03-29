import { Image } from 'react-native';

export function toImageSource(image) {
  if (!image) {
    return null;
  }

  if (typeof image === 'number') {
    const resolved = Image.resolveAssetSource(image);
    return resolved?.uri ? { uri: resolved.uri } : null;
  }

  if (typeof image === 'string') {
    return { uri: image };
  }

  if (typeof image === 'object' && typeof image.uri === 'string') {
    return image;
  }

  return null;
}

export function normalizeImageForState(image) {
  if (!image) {
    return null;
  }

  if (typeof image === 'string') {
    return image;
  }

  if (typeof image === 'object' && typeof image.uri === 'string') {
    return image.uri;
  }

  if (typeof image === 'number') {
    const resolved = Image.resolveAssetSource(image);
    return resolved?.uri ?? null;
  }

  return null;
}
