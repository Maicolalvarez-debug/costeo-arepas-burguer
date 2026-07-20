export const metadata = {
  title: "Costeo — Arepas y Burguer",
  description: "Ingredientes, recetas y precios de venta local y Rappi.",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#FAF3E6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
