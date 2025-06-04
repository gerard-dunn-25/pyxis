'use client'

import { signInSchema } from '@/schemas/signInSchema'
import { useSignIn } from '@clerk/nextjs'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { resourceLimits } from 'worker_threads'
import { z } from 'zod'

export default function SignInForm() {
  const router = useRouter()
  const { signIn, isLoaded, setActive } = useSignIn()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const {} = useForm({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  })

  const onSubmit = async (data: z.infer<typeof signInSchema>) => {
    if (!isLoaded) return
    setIsSubmitting(true)
    setAuthError(null)

    try {
      const result = await signIn.create({
        identifier: data.identifier,
        password: data.password,
      })

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        router.push('/dashboard')
      } else {
        console.error('Sign in failed:', result)
        setAuthError('Sign in could not be completed. Please try again')
      }
    } catch (error: any) {
      setAuthError(
        error.errors?.[0]?.message ||
          'An error occurred during sign in. Please try again.'
      )
    } finally {
      setIsSubmitting(false)
    }

    return <h1>Return a sign in form</h1>
  }
}
