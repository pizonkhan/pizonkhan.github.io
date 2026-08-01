import { ButtonLink } from '@/components/ui/ButtonLink'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Container } from '@/components/ui/Container'

export const metadata = {
  title: 'Page not found',
}

export default function NotFound() {
  return (
    <Container width="narrow" className="flex min-h-[60vh] flex-col justify-center gap-4 py-(--space-section)">
      <Eyebrow>404</Eyebrow>
      <h1 className="text-h1 text-text-primary">This page does not exist.</h1>
      <p className="text-lead text-text-secondary max-w-(--measure-prose)">
        The link either moved or never worked. Start from the demonstrations, or head home.
      </p>
      <div className="mt-2 flex gap-3">
        <ButtonLink href="/">Home</ButtonLink>
        <ButtonLink href="/projects/" variant="ghost">
          See the demonstrations
        </ButtonLink>
      </div>
    </Container>
  )
}
