import { useNavigate } from 'react-router-dom'
import { useFormStore } from '@/store/useFormStore'
import { transactionForm } from '@/data/formTemplates'
import { formForProduct, getProduct, quoteType, type Product } from '@/data/products'
import type { FormType } from '@/data/types'
import type { Policy } from '@/data/policies'

export type TxnKind = 'quote' | 'endorsement' | 'cancellation' | 'claim' | 'renewal'

const KIND_TYPE: Record<Exclude<TxnKind, 'quote'>, FormType> = {
  endorsement: 'Endorsement',
  cancellation: 'Cancellation',
  claim: 'Claim',
  renewal: 'Renewal',
}

/**
 * Opens the applicant flow for a customer transaction, loading the right
 * product/form and recording context so the policy can be bound/updated on
 * submit. A new quote needs a `product`; a policy-bound action needs a `policy`.
 * The selected form is set as the runtime override — it never touches the
 * designer's form.
 */
export function useStartTransaction() {
  const navigate = useNavigate()
  const resetAnswers = useFormStore((s) => s.reset)
  const setAnswer = useFormStore((s) => s.setAnswer)
  const setRuntimeForm = useFormStore((s) => s.setRuntimeForm)
  const setTxnContext = useFormStore((s) => s.setTxnContext)

  return (kind: TxnKind, opts: { product?: Product; policy?: Policy } = {}) => {
    resetAnswers()

    if (kind === 'quote') {
      const product = opts.product
      if (!product) return
      setRuntimeForm(formForProduct(product, quoteType(product)))
      setTxnContext({ kind, productId: product.id })
    } else {
      const policy = opts.policy
      if (!policy) return
      const product = getProduct(policy.productId)
      setRuntimeForm(
        product ? formForProduct(product, KIND_TYPE[kind]) : transactionForm(KIND_TYPE[kind], policy.product),
      )
      setTxnContext({ kind, policyId: policy.id })
      setAnswer('policyNumber', policy.number)
    }
    navigate('/apply')
  }
}
