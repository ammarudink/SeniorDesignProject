export function resolveAssetPath(value) {
  if (!value) {
    return "/assets/noImage.png";
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `/${value.replace(/^frontend\//, "")}`;
}
