import React, { useState } from "react";
import { PageButton } from "./pageButton";

export function Footer() {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'fixed',
            bottom: 0,
            width: '100%',
            background: 'linear-gradient(to right, #261b32, #461b52)',
            borderTop: '1px solid gray'
        }}>
            <p style={{ fontSize: '20px', fontFamily: 'monospace', marginTop: '20px' }}>Click here to nevigate   to:</p>
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                width: '100%',
                flexWrap: 'wrap'
            }}>
                <PageButton content={"Main Page"} href={"/"} />
                <PageButton content={"Graph 1: Daily Caffeine Intake, Total Years as Dispatcher and the Resulting Sleep Loss"} href={"/graph1"} />
                <PageButton content={"Graph 2"} href={"/graph2"} />
                <PageButton content={"Graph 3"} href={"/graph3"} />
                <PageButton content={"Graph 4"} href={"/graph4"} />
            </div>
        </div>
    );
}