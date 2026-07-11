import { useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Stack,
} from '@/shared/ui'
import { cn } from '@/shared/lib/class-names'
import { isError } from '@/shared/lib/guards'

type ShareButtonProps = {
  /** Creates the current share URL when the menu is opened. */
  createShareUrl: () => Promise<string>
  /** Additional classes for the share trigger button. */
  className?: string
}

const SHARE_BUTTON_SRC = '/DSA%20view%20view%20share%20button.png'
const SHARE_BUTTON_HOVER_SRC = '/DSA%20view%20view%20share%20button%20hover.png'
const COPY_FAILED_STATUS = 'Copy failed. Select and copy the link manually.'
const LINKEDIN_COPIED_STATUS = 'Link copied. Paste it into your LinkedIn post.'
const COPIED_FEEDBACK_DURATION_MS = 1800

const SOCIAL_LINKS = [
  {
    name: 'X',
    iconSrc: '/sns/x.svg',
    iconClassName: 'h-8 w-8',
    createUrl: (url: string) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`,
  },
  {
    name: 'BlueSky',
    iconSrc: '/sns/bluesky.svg',
    iconClassName: 'h-7 w-7',
    createUrl: (url: string) =>
      `https://bsky.app/intent/compose?text=${encodeURIComponent(url)}`,
  },
]

const LINKEDIN_LINK = {
  name: 'LinkedIn',
  iconSrc: '/sns/linkedin.svg',
  createUrl: (url: string) =>
    `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
}

export function ShareButton({ createShareUrl, className }: ShareButtonProps) {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [isCopied, setIsCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const copiedTimeoutRef = useRef<number | null>(null)

  const clearCopiedTimeout = () => {
    if (copiedTimeoutRef.current !== null) {
      window.clearTimeout(copiedTimeoutRef.current)
      copiedTimeoutRef.current = null
    }
  }

  useEffect(() => {
    return () => clearCopiedTimeout()
  }, [])

  const copyShareUrl = async () => {
    if (!url) return false

    try {
      await navigator.clipboard.writeText(url)
      return true
    } catch {
      return false
    }
  }

  const handleOpen = async () => {
    setOpen(true)
    setStatus(null)
    setIsCopied(false)
    clearCopiedTimeout()
    setIsLoading(true)

    try {
      const nextUrl = await createShareUrl()
      setUrl(nextUrl)
    } catch (error) {
      setUrl('')
      setStatus(isError(error) ? error.message : 'Failed to create link')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!url) return

    const didCopy = await copyShareUrl()

    if (didCopy) {
      setStatus(null)
      setIsCopied(true)
      clearCopiedTimeout()
      copiedTimeoutRef.current = window.setTimeout(() => {
        setIsCopied(false)
        copiedTimeoutRef.current = null
      }, COPIED_FEEDBACK_DURATION_MS)
    } else {
      setIsCopied(false)
      setStatus(COPY_FAILED_STATUS)
    }
  }

  const handleLinkedInShare = async () => {
    if (!url || isLoading) return

    const shareUrl = LINKEDIN_LINK.createUrl(url)
    const popup = window.open('', '_blank')
    if (popup) {
      popup.opener = null
    }

    const didCopy = await copyShareUrl()

    setIsCopied(false)
    setStatus(didCopy ? LINKEDIN_COPIED_STATUS : COPY_FAILED_STATUS)

    if (popup) {
      popup.location.href = shareUrl
    } else {
      window.location.href = shareUrl
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Open link menu"
        className={cn(
          'group relative inline-flex h-16 w-full max-w-[16rem] cursor-pointer items-center justify-center bg-transparent p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          className
        )}
        onClick={handleOpen}
      >
        <img
          src={SHARE_BUTTON_SRC}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-contain opacity-100 transition-opacity group-hover:opacity-0 group-focus-visible:opacity-0"
        />
        <img
          src={SHARE_BUTTON_HOVER_SRC}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-contain opacity-0 transition-opacity group-hover:opacity-75 group-focus-visible:opacity-75"
        />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share visualization</DialogTitle>
            <DialogDescription>
              Code and inputs are embedded in this link and run locally in the
              browser.
            </DialogDescription>
          </DialogHeader>
          <Stack spacing="sm">
            <div className="grid grid-cols-3 gap-2 mb-4">
              {SOCIAL_LINKS.map((link) => (
                <a
                  key={link.name}
                  href={url ? link.createUrl(url) : undefined}
                  target="_blank"
                  rel="noreferrer"
                  aria-disabled={!url || isLoading}
                  className={cn(
                    'pixel-button pixel-button--outline inline-flex h-16 items-center justify-center border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    !url || isLoading
                      ? 'pointer-events-none opacity-50'
                      : 'hover:bg-primary/10'
                  )}
                >
                  <img
                    src={link.iconSrc}
                    alt={link.name}
                    className={link.iconClassName}
                  />
                </a>
              ))}
              <button
                type="button"
                disabled={!url || isLoading}
                className={cn(
                  'pixel-button pixel-button--outline inline-flex h-16 items-center justify-center border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
                  url && !isLoading && 'hover:bg-primary/10'
                )}
                onClick={handleLinkedInShare}
              >
                <img
                  src={LINKEDIN_LINK.iconSrc}
                  alt={LINKEDIN_LINK.name}
                  className="h-8 w-8"
                />
              </button>
            </div>
            <Input
              readOnly
              aria-label="Share URL"
              value={isLoading ? 'Creating link...' : url}
              onFocus={(event) => event.currentTarget.select()}
            />
            {status && (
              <p className="text-sm text-muted-foreground">{status}</p>
            )}
            <Button
              type="button"
              disabled={!url || isLoading}
              className="gap-2"
              onClick={handleCopy}
            >
              {isCopied ? (
                <>
                  <Check className="h-4 w-4" aria-hidden="true" />
                  Copied
                </>
              ) : (
                'Copy link'
              )}
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  )
}
