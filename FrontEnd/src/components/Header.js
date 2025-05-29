import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Header.css';

const Header = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('isLoggedIn');
        navigate('/login');
    };

    return (
        <header className="main-header">
            <div className="header-logo-title">
                <img 
                    src="//upload.wikimedia.org/wikipedia/commons/thumb/1/1a/TV_Globo_2021.svg/250px-TV_Globo_2021.svg.png" 
                    alt="Logo Globo" 
                    className="header-logo-globo" 
                />
                <h1>GloboWatch</h1>
                <button onClick={handleLogout} className="logout-button">Sair</button>
            </div>
        </header>
    );
};

export default Header;

