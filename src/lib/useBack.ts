import { useLocation, useNavigate } from 'react-router-dom'

/** Retour arrière ; si on est sur la première page de la session, retour à `fallback`. */
export function useBack(fallback = '/') {
  const navigate = useNavigate()
  const { key } = useLocation()
  return () => (key !== 'default' ? navigate(-1) : navigate(fallback))
}
