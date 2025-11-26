import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './AuthCallback.css';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const handleCallback = async () => {
      // Check for error in URL
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');

      if (error) {
        // Handle error cases
        if (error === 'access_denied') {
          if (errorDescription?.includes('expired')) {
            setStatus('error');
            setMessage('Email confirmation link has expired. Please request a new confirmation email.');
          } else {
            setStatus('error');
            setMessage('Email confirmation failed. Please try again.');
          }
        } else {
          setStatus('error');
          setMessage(errorDescription || 'Authentication failed. Please try again.');
        }
        return;
      }

      // If tokens are present, store them and refresh user
      if (accessToken && refreshToken) {
        try {
          localStorage.setItem('access_token', accessToken);
          localStorage.setItem('refresh_token', refreshToken);
          
          // Refresh user data
          await refreshUser();
          
          setStatus('success');
          setMessage('Email confirmed successfully! Redirecting to dashboard...');
          
          // Redirect to dashboard after 2 seconds
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } catch (err) {
          console.error('Error processing callback:', err);
          setStatus('error');
          setMessage('Failed to complete authentication. Please try logging in.');
        }
      } else {
        // No tokens, might be a different callback type
        setStatus('error');
        setMessage('Invalid callback. Please try logging in again.');
      }
    };

    handleCallback();
  }, [searchParams, navigate, refreshUser]);

  return (
    <div className="auth-callback-container">
      <div className="auth-callback-card">
        {status === 'processing' && (
          <>
            <div className="spinner"></div>
            <h2>Processing...</h2>
            <p>{message}</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <h2>Success!</h2>
            <p>{message}</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <h2>Error</h2>
            <p>{message}</p>
            <div className="callback-actions">
              <button onClick={() => navigate('/login')} className="callback-button">
                Go to Login
              </button>
              <button onClick={() => navigate('/register')} className="callback-button secondary">
                Register Again
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;

