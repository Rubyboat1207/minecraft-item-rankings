// components/AuthWithCaptcha.jsx
import { useState } from 'react'
import HCaptcha from '@hcaptcha/react-hcaptcha'
import { supabase } from '../lib/supabase'

interface AuthWithCaptchaProps {
  onAuthSuccess: (user: any) => void; // Replace 'any' with a more specific type if available
}

function AuthWithCaptcha({ onAuthSuccess }: AuthWithCaptchaProps) {
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const handleCaptchaVerify = (token: string) => {
    setCaptchaToken(token)
  }

  const signInAnonymously = async () => {
    if (!captchaToken) {
      setError('Please complete the captcha')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInAnonymously({
        options: {
          captchaToken: captchaToken
        }
      })

      if (error) throw error
      
      onAuthSuccess(data.user)
    } catch (err) {
      if(err instanceof Error)
        setError(err.message)
      setCaptchaToken(null) // Reset captcha on error
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <h2>Start Comparing Minecraft Items</h2>
      <p>Complete the captcha to begin:</p>
      
      <HCaptcha
        sitekey={import.meta.env.VITE_HCAPTCHA_SITE_KEY}
        onVerify={handleCaptchaVerify}
        onError={() => setError('Captcha failed, please try again')}
        onExpire={() => setCaptchaToken(null)}
      />
      
      <button 
        onClick={signInAnonymously}
        disabled={!captchaToken || loading}
        style={{ 
          marginTop: '10px',
          opacity: (!captchaToken || loading) ? 0.5 : 1 
        }}
      >
        {loading ? 'Signing in...' : 'Start Comparing'}
      </button>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}

export default AuthWithCaptcha