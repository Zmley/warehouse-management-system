// pages/RefreshBridge.tsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const RefreshBridge = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const timeout = setTimeout(() => {
      navigate('/', { replace: true, state: { view: 'cart' } })
      window.location.reload()
    }, 800)

    return () => clearTimeout(timeout)
  }, [])

  return null
}

export default RefreshBridge
