import React, { useState } from 'react';
import { auth } from '../firebaseConfig'; // Ensure the path is correct
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const SignUp = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    
    // Check if passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match!');
      return;
    }
    
    try {
      // Create a new user with email and password
      await createUserWithEmailAndPassword(auth, email, password);
      console.log('Sign Up successful');
      navigate('/dashboard');
      // Redirect or perform other actions after successful sign-up
    } catch (error) {
      console.error('Error signing up:', error);
      setError('Error signing up: ' + error.message); // Display error message
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-[#000000]">
      <div className="p-10 rounded-lg shadow-lg text-center w-96 bg-[#2C2F48]">
        <h2 className="mb-5 text-4xl text-[#6C63FF] font-bold">Sign Up</h2>
        {error && <p className="text-red-500">{error}</p>}
        <form onSubmit={handleSignUp}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 mb-3 rounded border border-gray-500 bg-[#3B3F5C] text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#6C63FF]"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 mb-3 rounded border border-gray-500 bg-[#3B3F5C] text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#6C63FF]"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 mb-3 rounded border border-gray-500 bg-[#3B3F5C] text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#6C63FF]"
            required
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full p-3 mb-3 rounded border border-gray-500 bg-[#3B3F5C] text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#6C63FF]"
            required
          />
          <button
            type="submit"
            className="w-full p-3 bg-[#6C63FF] text-white rounded hover:bg-[#FF6584] transition-colors duration-200"
          >
            Sign Up
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignUp;
