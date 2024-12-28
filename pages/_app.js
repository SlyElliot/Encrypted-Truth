// pages/_app.js
import '../styles/globals.css'; // Ensure the correct path to styles.css

export default function MyApp({ Component, pageProps }) {
    return <Component {...pageProps} />;
}
