import "./globals.css";

export const metadata = {
  title: "CV → QR",
  description: "Turn a CV PDF or a link into a scannable QR code.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
