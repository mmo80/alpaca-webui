// url: https://gist.github.com/adnanalbeda/12d6fbe8a40d1a79a0ca9e772b0a3863

import { Children, cloneElement, createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Slot, type SlotProps } from '@radix-ui/react-slot';
import { type DialogProps } from '@radix-ui/react-dialog';

type Maybe<T> = T | null | undefined;

const MultiDialogContainerContext = createContext<unknown>(null);
MultiDialogContainerContext.displayName = 'MultiDialogContainerContext';

export function useMultiDialog<T = unknown>(): [Maybe<T>, React.Dispatch<React.SetStateAction<Maybe<T>>>];
export function useMultiDialog<T = unknown>(v: T): [boolean, (v: boolean) => void];
export function useMultiDialog<T = unknown>(v?: T) {
  const s = useContext(MultiDialogContainerContext) as [Maybe<T>, React.Dispatch<React.SetStateAction<Maybe<T>>>];

  const [dialog, setDialog] = s;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onOpenChange = useCallback((o: boolean) => (o ? setDialog(v) : setDialog(null)), [v]);

  if (!s) throw new Error("Cannot use 'useMultiDialog' outside 'MultiDialogProvider'.");

  const open = dialog === v;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const result = useMemo(() => [open, onOpenChange] as const, [open]);

  if (v == null) return s;

  return result;
}

export function MultiDialogTrigger<T = unknown>({
  value,
  onClick,
  ...props
}: SlotProps &
  React.RefAttributes<HTMLElement> & {
    value: T;
  }) {
  const [, open] = useMultiDialog(value);
  const oc = useCallback<React.MouseEventHandler<HTMLElement>>(
    (e) => {
      open(true);
      onClick && onClick(e);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [value, onClick]
  );
  return <Slot onClick={oc} {...props} />;
}

export function MultiDialogContainer<T = unknown>({
  value,
  children,
  ...props
}: Omit<DialogProps, 'open' | 'onOpenChange'> & {
  value: T;
  children?: React.JSX.Element;
}) {
  const [open, onOpenChange] = useMultiDialog(value);

  return useMemo(() => {
    Children.only(children);
    return children
      ? cloneElement(children, {
          ...props,
          open,
          onOpenChange,
        })
      : null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children, open]);
}

type Builder<T = unknown> = {
  readonly Trigger: (...args: Parameters<typeof MultiDialogTrigger<T>>) => React.ReactNode;
  readonly Container: (...args: Parameters<typeof MultiDialogContainer<T>>) => React.ReactNode;
};

const builder = {
  Trigger: MultiDialogTrigger,
  Container: MultiDialogContainer,
} as const;

export type MultiDialogBuilder<T = unknown> = (builder: Builder<T>) => React.ReactNode;
export function MultiDialog<T = unknown>({
  defaultOpen = null,
  children,
}: Readonly<{
  defaultOpen?: T | null;
  children?: React.ReactNode | MultiDialogBuilder<T>;
}>) {
  const [state, setState] = useState<T | null>(defaultOpen);

  const c = useMemo(() => (typeof children === 'function' ? children(builder) : children), [children]);
  const value = useMemo(() => [state, setState], [state]);

  return <MultiDialogContainerContext.Provider value={value}>{c}</MultiDialogContainerContext.Provider>;
}
