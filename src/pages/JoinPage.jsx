import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

export default function JoinPage() {
  const { code } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    if (code) localStorage.setItem('pending_invite_code', code.toUpperCase())
    navigate('/', { replace: true })
  }, [])

  return null
}
