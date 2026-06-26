import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { GraduationCap, Loader2, Shield, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'

export function LoginPage() {
  const { login, isAuthenticated, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await login(email, password)
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-violet-500/10" />
        <div className="pointer-events-none absolute -right-20 top-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Techackode</h1>
            <p className="flex items-center gap-1 text-sm text-sidebar-foreground/70">
              <Sparkles className="h-3.5 w-3.5" />
              Edutech Management Platform
            </p>
          </div>
        </div>

        <div className="relative space-y-6">
          <h2 className="max-w-lg text-4xl font-bold leading-tight tracking-tight">
            Enterprise dashboard for modern education operations
          </h2>
          <p className="max-w-md text-base leading-relaxed text-sidebar-foreground/75">
            Students, teachers, IT projects, HR, finance, assets, and documents — unified in one advanced workspace.
          </p>
          <div className="flex flex-wrap gap-3">
            {['Secure access', 'Role-based control', 'Real-time modules'].map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm backdrop-blur-sm"
              >
                <Shield className="h-3.5 w-3.5 text-primary-foreground/80" />
                {item}
              </span>
            ))}
          </div>
        </div>

        <p className="relative text-sm text-sidebar-foreground/50">
          © {new Date().getFullYear()} Techackode Edutech
        </p>
      </div>

      <div className="app-mesh-bg flex flex-1 items-center justify-center p-6">
        <Card className="w-full max-w-md border-border/60 shadow-2xl">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25 lg:hidden">
              <GraduationCap className="h-7 w-7" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
              <CardDescription className="mt-1.5">Sign in to your Techackode admin workspace</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@techackode.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              <Button type="submit" className="h-11 w-full text-base" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in to dashboard'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
