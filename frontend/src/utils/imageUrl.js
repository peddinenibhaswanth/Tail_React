const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export const resolveImageUrl = (value, folder) => {
  if (!value || typeof value !== "string") return "";
  const v = value.trim();

  // Already an absolute URL (Cloudinary, etc.)
  if (/^https?:\/\//i.test(v)) return v;

  // Data URL preview
  if (v.startsWith("data:")) return v;

  // Already a server-relative path (e.g. /uploads/users/abc.jpg)
  if (v.startsWith("/")) return `${API_URL}${v}`;

  // Plain filename stored in DB
  if (folder) return `${API_URL}/uploads/${folder}/${v}`;

  return `${API_URL}/${v}`;
};
