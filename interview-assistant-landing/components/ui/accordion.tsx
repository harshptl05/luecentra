'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface AccordionContextValue {
  open: string | null;
  setOpen: (value: string | null) => void;
}

const AccordionContext = React.createContext<AccordionContextValue | null>(null);

function useAccordion() {
  const ctx = React.useContext(AccordionContext);
  if (!ctx) throw new Error('Accordion components must be used within Accordion');
  return ctx;
}

export function Accordion({
  type = 'single',
  defaultValue,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  type?: 'single';
  defaultValue?: string;
}) {
  const [open, setOpen] = React.useState<string | null>(defaultValue ?? null);
  return (
    <AccordionContext.Provider value={{ open, setOpen }}>
      <div className={cn('space-y-1', className)} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

export function AccordionItem({
  value,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { value: string }) {
  return (
    <div
      className={cn('rounded-lg border border-card-border bg-card px-4', className)}
      {...props}
    />
  );
}

export function AccordionTrigger({
  value,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLButtonElement> & { value: string }) {
  const { open, setOpen } = useAccordion();
  const isOpen = open === value;
  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-center justify-between py-4 text-left font-medium transition-colors hover:text-accent [&[data-state=open]>svg]:rotate-180',
        className
      )}
      onClick={() => setOpen(isOpen ? null : value)}
      data-state={isOpen ? 'open' : 'closed'}
      {...props}
    >
      {children}
      <svg
        className="h-4 w-4 shrink-0 transition-transform duration-200"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
}

export function AccordionContent({
  value,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { value: string }) {
  const { open } = useAccordion();
  if (open !== value) return null;
  return (
    <div className={cn('overflow-hidden pb-4 pt-0 text-sm text-muted', className)} {...props}>
      {children}
    </div>
  );
}
