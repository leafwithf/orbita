import type { MetadataRoute } from "next";

// App privado: nada para indexar. Links /p/... também levam noindex por cabeçalho.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
