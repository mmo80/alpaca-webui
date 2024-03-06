import * as React from 'react';
import { Button } from '@/components/ui/button';

interface PageDownButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const PageDownButton = React.forwardRef<HTMLButtonElement, PageDownButtonProps>(({ ...props }, ref) => {
  return (
    <Button variant="outline" size="icon" ref={ref} {...props}>
      <svg
        className="h-4 w-4 text-gray-800 dark:text-white"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 10 14"
      >
        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 1v12m0 0 4-4m-4 4L1 9" />
      </svg>
    </Button>
  );
});

PageDownButton.displayName = 'PageDownButton';

export { PageDownButton };
