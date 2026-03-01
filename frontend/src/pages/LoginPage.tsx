import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { login } from '../api/client';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const { token } = await login(username, password);
      // Handle successful login
    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        setError('Invalid username or password');
      } else if (error.response) {
        setError(`Error ${error.response.status}: ${error.response.statusText}`);
      } else {
        setError('An error occurred while logging in');
      }
    }
  };

  return (
    <div>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Username:
          <input type="text" value={username} onChange={(event) => setUsername(event.target.value)} />
        </label>
        <br />
        <label>
          Password:
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        <br />
        <button type="submit">Login</button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>
      <p>
        Don't have an account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
}
