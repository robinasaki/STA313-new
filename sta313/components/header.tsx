import React, { useState } from "react";

const Header = () => {
    const [hamburgerMenuOpened, setHamburgerMenuOpened] = useState(false);

    return (
        <div
            className="flex justify-between items-center p-4 relative"
            style={{
                borderBottom: '1px solid gray',
                background: 'linear-gradient(to right, #261b32, #461b52)'
            }}
        >
            <div className="flex items-center">
                <button onClick={() => setHamburgerMenuOpened(!hamburgerMenuOpened)}>
                    <span
                        style={{
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
                        className="transform hover:scale-110" // Updated classes
                    >
                        ≡
                    </span>
                </button>

                <div
                    style={{
                        fontSize: '25px',
                        marginLeft: '30px',
                        marginTop: '5px',
                    }}
                >
                    Sleep Analysis for a Healthier Lifestyle for Labour-Intense Jobs
                </div>
            </div>

            {/* Always render the menu and control its visibility and transformation */}
            <div
                style={{
                    zIndex: 10,
                    fontSize: '15px',
                    color: 'white',
                    position: 'absolute',
                    top: '100%',
                    left: '10px',
                    width: '15%',
                    background: 'linear-gradient(to bottom, #1f2937, #1f2947)',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column', // Changed to 'column' for vertical layout
                    alignItems: 'flex-start',
                    borderTop: '1px solid gray',
                    borderBottomRightRadius: '10px',
                    borderBottomLeftRadius: '10px',
                    borderRight: '1px solid gray',
                    borderBottom: '1px solid gray',
                    borderLeft: '1px solid gray',
                    transition: 'transform 0.3s ease, opacity 0.3s ease',
                    transform: hamburgerMenuOpened ? 'translateY(0)' : 'translateY(-20px)',
                    opacity: hamburgerMenuOpened ? 1 : 0,
                    pointerEvents: hamburgerMenuOpened ? 'auto' : 'none', // Prevent interaction when closed
                }}
            >
                <ul className="flex flex-col p-7" style={{width: '200px'}}>
                    <li className="py-2">Developed By: </li>
                    <li className="py-2">Chenxu (Robin) Mao</li>
                </ul>
            </div>
        </div>
    );
}

export default Header;