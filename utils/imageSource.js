export function toImageSource(image) {
  if (typeof image === 'string') {
    return { uri: image };
  }

  return image;
}
