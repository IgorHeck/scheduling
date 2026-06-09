import { useParams } from 'react-router-dom'

/**
 * Lê o companyId diretamente da URL (/:companyId/...).
 * Deve ser usado apenas em rotas que contenham o segmento :companyId.
 */
export function useCompanyId(): number | null {
  const { companyId } = useParams<{ companyId: string }>()
  return companyId ? Number(companyId) : null
}
