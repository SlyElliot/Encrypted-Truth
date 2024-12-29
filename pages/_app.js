// pages/_app.js
import '../styles/globals.css'; // Ensure the correct path to styles.css
import { Analytics } from "@vercel/analytics/react";

export default function MyApp({ Component, pageProps }) {
    return <Component {...pageProps} />;
}
