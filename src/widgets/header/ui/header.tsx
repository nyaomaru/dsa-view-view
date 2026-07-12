import { Button, Heading, Paragraph } from '@/shared/ui'
import { cn } from '@/shared/lib/class-names'
import type { AppMode } from '@/shared/model'
import { ViewViewMonitor } from '@/features/visualization'

/** Props for the mobile mode switcher shown above the editor on small screens. */
type MobileHeaderProps = {
  /** Active application mode. */
  mode: AppMode
  /** Callback when the user switches modes. */
  onModeChange: (mode: AppMode) => void
  /** Whether the verification tab is disabled. */
  isVerificationDisabled: boolean
  /** Whether the runtime tab is disabled. */
  isRuntimeDisabled: boolean
  /** Current View View animation image source. */
  viewViewAnimationSrc: string | null
  /** Callback when the current View View animation image loads. */
  onViewViewAnimationLoad?: () => void
  /** Whether to render the View View monitor between title and tabs. */
  showViewViewMonitor?: boolean
}

/** Config for each mobile navigation button in the mode switcher. */
type MobileModeOption = {
  /** Application mode selected by this option. */
  value: AppMode
  /** Visible button label. */
  label: string
  /** Whether this option is currently disabled. */
  disabled: boolean
}

/** Props for the logo image. */
type LogoImageProps = {
  /** Additional CSS classes for sizing/positioning the logo. */
  className?: string
}

function LogoImage({ className }: LogoImageProps) {
  return (
    <img
      src="/DSA%20view%20view_text%20logo.png"
      alt="DSA ViewView"
      className={cn('h-auto w-full max-w-[20rem]', className)}
    />
  )
}

/**
 * Top-level application header with title and description
 */
export function AppHeader() {
  return (
    <header className="hidden min-w-0 flex-none space-y-2 lg:block">
      <Heading level={1} className="tracking-tight text-3xl">
        <LogoImage className="max-w-[22.5rem]" />
      </Heading>
      <Paragraph variant="muted" className="text-balance">
        Write, validate, and visualize your algorithms step-by-step. Support for
        TypeScript with real-time feedback.
      </Paragraph>
    </header>
  )
}

/**
 * Mobile-specific sticky header with mode navigation
 */
export function MobileHeader({
  mode,
  onModeChange,
  isVerificationDisabled,
  isRuntimeDisabled,
  viewViewAnimationSrc,
  onViewViewAnimationLoad,
  showViewViewMonitor = true,
}: MobileHeaderProps) {
  const modeOptions: MobileModeOption[] = [
    { value: 'editor', label: 'Editor', disabled: false },
    {
      value: 'verification',
      label: 'Verification',
      disabled: isVerificationDisabled,
    },
    { value: 'runtime', label: 'Runtime', disabled: isRuntimeDisabled },
  ]

  return (
    <div className="lg:hidden sticky top-0 z-50 bg-background border-b flex-none">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <Heading level={2} className="text-lg">
            <LogoImage className="max-w-[11.25rem]" />
          </Heading>
        </div>
        {showViewViewMonitor && (
          <ViewViewMonitor
            viewViewAnimationSrc={viewViewAnimationSrc}
            onViewViewAnimationLoad={onViewViewAnimationLoad}
            className="mx-auto my-2 w-full max-w-[28rem]"
          />
        )}
        <div className="flex gap-1">
          {modeOptions.map(({ value, label, disabled }) => (
            <Button
              key={value}
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              className={cn(
                'flex-1 py-1.5 text-xs transition-all',
                mode === value
                  ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90'
                  : 'border-input text-muted-foreground hover:bg-transparent'
              )}
              onClick={() => onModeChange(value)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
