import React from "react";
import { AppProps } from 'next/app';
import 'tailwindcss/tailwind.css';
import Header from "@/components/header";

const App = ({ Component, pageProps }: AppProps) => {
    return (
        <div
            style={{
                minHeight: '100vh', 
                fontFamily: "Helvetica",
                background: 'linear-gradient(to right, #161b22, #261b32)',
                color: 'whitesmoke',
                fontWeight: 'lighter'
            }}
        >
            <Header />
            <Component {...pageProps} />
        </div>
    );
}
export default App;