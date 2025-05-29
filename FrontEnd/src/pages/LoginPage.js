import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css'; // Criaremos este arquivo para os estilos da página de login

// Importar o logo da Globo (assumindo que será colocado na pasta assets)
// import globoLogo from '../assets/images/logo-globo.svg'; // Exemplo de caminho

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (event) => {
        event.preventDefault();
        if (username === 'admin' && password === 'admin') {
            localStorage.setItem('isLoggedIn', 'true'); // Simples flag de login
            navigate('/'); // Redireciona para a página principal
        } else {
            setError('Usuário ou senha inválidos. Por favor, tente novamente.');
            localStorage.removeItem('isLoggedIn');
        }
    };

    return (
        <div className="login-page-container">
            <div className="login-form-container">
                <div className="login-logo-container">
                    {/* <img src={globoLogo} alt="Logo Globo" className="login-logo-globo" /> */}
                    <img src="//upload.wikimedia.org/wikipedia/commons/thumb/1/1a/TV_Globo_2021.svg/250px-TV_Globo_2021.svg.png" alt="Logo Globo" className="login-logo-globo" />
                </div>
                <h1>Login GloboWatch</h1>
                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="username">Usuário</label>
                        <input 
                            type="text" 
                            id="username" 
                            name="username" 
                            placeholder="Digite seu usuário" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required 
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Senha</label>
                        <input 
                            type="password" 
                            id="password" 
                            name="password" 
                            placeholder="Digite sua senha" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required 
                        />
                    </div>
                    {error && <p className="login-error-message">{error}</p>}
                    <button type="submit" className="login-button">Entrar</button>
                </form>
                <div className="login-footer">
                    <p>&copy; {new Date().getFullYear()} Todos os direitos reservados.</p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;

