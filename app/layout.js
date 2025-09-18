import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--poppins",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"]
});

export const metadata = {
  title: "Weather App",
  description: "A modern weather forecasting application built with Next.js. Get real-time weather updates, 5-day forecasts, sunrise/sunset timings, and more — with a clean and responsive design.",
  keywords: [
    "Weather App",
    "Next.js Project",
    "Weather Forecast",
    "Internship Project",
    "5-Day Forecast",
    "Real-time Weather",
    "Weather App Internship Project",
  ],
  authors: [{ name: "Mahesh Chaudhary" }],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${poppins.className} bg-sky-950 text-white overflow-x-hidden antialiased`}
      >
        <div className="fixed overflow-hidden inset-0 bg-[url('/bg.jpg')] bg-cover sm:bg-center -z-10">
          <div className="absolute inset-0 bg-sky-950/95 -z-10"></div>
        </div>
        {children}
      </body>
    </html>
  );
}
