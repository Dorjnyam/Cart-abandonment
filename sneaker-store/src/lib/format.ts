export function formatMnt(value: number) {
  return `₮${Math.round(value).toLocaleString("mn-MN")}`;
}
