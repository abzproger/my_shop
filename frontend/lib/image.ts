const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
const apiOrigin = apiUrl.replace(/\/api\/?$/, "");

export function resolveImageUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  if (url.startsWith("/")) {
    return `${apiOrigin}${url}`;
  }
  return `${apiOrigin}/${url}`;
}
