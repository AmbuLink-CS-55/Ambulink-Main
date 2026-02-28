import { useCallback, useState } from "react";

type UseEntityFormDialogOptions<TEntity, TForm> = {
  initialForm: TForm;
  mapEntityToForm: (entity: TEntity) => TForm;
};

export function useEntityFormDialog<TEntity, TForm>({
  initialForm,
  mapEntityToForm,
}: UseEntityFormDialogOptions<TEntity, TForm>) {
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<TEntity | null>(null);
  const [form, setForm] = useState<TForm>(initialForm);

  const openForCreate = useCallback(() => {
    setEditing(null);
    setForm(initialForm);
    setIsOpen(true);
  }, [initialForm]);

  const openForEdit = useCallback(
    (entity: TEntity) => {
      setEditing(entity);
      setForm(mapEntityToForm(entity));
      setIsOpen(true);
    },
    [mapEntityToForm]
  );

  const onOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      if (!open) {
        setEditing(null);
        setForm(initialForm);
      }
    },
    [initialForm]
  );

  const reset = useCallback(() => {
    setIsOpen(false);
    setEditing(null);
    setForm(initialForm);
  }, [initialForm]);

  const updateForm = useCallback(<K extends keyof TForm>(field: K, value: TForm[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  return {
    isOpen,
    editing,
    form,
    setForm,
    openForCreate,
    openForEdit,
    onOpenChange,
    reset,
    updateForm,
  };
}
