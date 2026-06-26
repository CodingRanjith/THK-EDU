import { BRAND } from '@/config/brand'

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-card/50 px-4 py-4 backdrop-blur-sm lg:px-6">
      <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row sm:text-sm">
        <p>© {new Date().getFullYear()} {BRAND.copyright}. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="#" className="transition-colors hover:text-primary">Privacy</a>
          <a href="#" className="transition-colors hover:text-primary">Terms</a>
          <a href="#" className="transition-colors hover:text-primary">Support</a>
        </div>
      </div>
    </footer>
  )
}
