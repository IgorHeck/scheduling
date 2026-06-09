import axios from 'axios'
import { useAuthStore } from '../store/authStore.ts'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(config => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

/*
 * Refresh single-flight: o backend rotaciona o refresh token (revoga o antigo a cada uso).
 * Se várias requisições recebem 401 ao mesmo tempo (comum ao voltar após o token expirar),
 * apenas UMA dispara o /auth/refresh; as demais aguardam e são reexecutadas com o token novo.
 * Sem isso, as requisições concorrentes tentariam refresh com o token já revogado e cairiam no logout.
 */
let isRefreshing = false
let pendingQueue: {
  resolve: (token: string) => void
  reject: (err: unknown) => void
}[] = []

function flushQueue(error: unknown, token: string | null) {
  pendingQueue.forEach(p => (token ? p.resolve(token) : p.reject(error)))
  pendingQueue = []
}

api.interceptors.response.use(
  res => res,
  async error => {
    const original = error.config
    const status = error.response?.status
    const refreshToken = useAuthStore.getState().refreshToken

    // Não tenta refresh em rotas de auth (login/refresh/etc) nem sem refresh token nem em retry repetido
    const isAuthRoute = typeof original?.url === 'string' && original.url.includes('/auth/')

    if (status !== 401 || original?._retry || !refreshToken || isAuthRoute) {
      return Promise.reject(error)
    }

    original._retry = true

    // Já há um refresh em andamento → entra na fila e reexecuta quando terminar
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        pendingQueue.push({ resolve, reject })
      }).then(token => {
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      })
    }

    isRefreshing = true
    try {
      const { data } = await axios.post(
        import.meta.env.VITE_API_URL + '/api/v1/auth/refresh',
        { refreshToken }
      )
      useAuthStore.getState().setTokens(data.accessToken, data.refreshToken)
      flushQueue(null, data.accessToken)
      original.headers.Authorization = `Bearer ${data.accessToken}`
      return api(original)
    } catch (refreshError) {
      // Refresh token realmente inválido/expirado → derruba a sessão
      flushQueue(refreshError, null)
      useAuthStore.getState().logout()
      window.location.href = '/login'
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)
