import React, { useState } from "react";

const Header = () => {
    const [hamburgerMenuOpened, setHamburgerMenuOpened] = useState(false);

    return (
        <div
            className="flex justify-between items-center p-4 relative"
            style={{
                borderBottom: '1px solid gray',
                background: 'linear-gradient(to right, #161b22, #361b42)'
            }}
        >
            <div className="flex items-center">
                <button onClick={() => setHamburgerMenuOpened(!hamburgerMenuOpened)}>
                    <span style={{
                        color: 'gray',
                        fontSize: '30px',
                        border: '1px solid lightgray',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: '40px',
                        height: '40px',
                        borderRadius: '5px',
                        fontFamily: 'Arial',
                        transition: 'transform 0.3s ease',
                    }}
                    className="hover:transform hover:scale-110"
                    >≡
                    </span>
                </button>

                <div style={{
                    fontSize: '25px',
                    marginLeft: '30px',
                    marginTop: '5px',
                }}>Sleep Analysis for a Healthier Lifestyle for Labour-Intense Jobs
                    
                </div>
            </div>

            {hamburgerMenuOpened && (
                <div
                    className="absolute top-full left-0 w-full bg-white shadow-md"
                    style={{
                        borderTop: '1px solid gray',
                        background: 'linear-gradient(to right, #161b22, #261b32)',
                        zIndex: 10
                    }}
                >
                    <ul className="flex flex-col p-4">
                        <li className="py-2 border-b border-gray-200">
                            <a href="#home" className="text-gray-300 hover:text-white">Home</a>
                        </li>
                        <li className="py-2 border-b border-gray-200">
                            <a href="#about" className="text-gray-300 hover:text-white">About</a>
                        </li>
                        <li className="py-2 border-b border-gray-200">
                            <a href="#services" className="text-gray-300 hover:text-white">Services</a>
                        </li>
                        <li className="py-2">
                            <a href="#contact" className="text-gray-300 hover:text-white">Contact</a>
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
}
export default Header;