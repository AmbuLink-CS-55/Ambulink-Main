import { useCallback, useMemo } from "react";
import { DataTable } from "@/components/VirtualizedTable";
import { Button } from "@/components/ui/button";
import { useEntityFormDialog } from "@/hooks/use-entity-form-dialog";
import {
  useCreateDispatcher,
  useGetDispatchers,
  useUpdateDispatcher,
} from "@/services/dispatcher.service";
import type { User } from "@/lib/types";
import { createDispatcherColumns } from "@/pages/dispatchers/components/dispatcher-columns";
import {
  CreateDispatcherDialog,
  EditDispatcherDialog,
  type DispatcherFormState,
} from "@/pages/dispatchers/components/DispatcherFormDialog";
import { useAuthStore } from "@/stores/auth.store";

const initialForm: DispatcherFormState = {
  fullName: "",
  phoneNumber: "",
  email: "",
  passwordHash: "",
};

export default function DispatchersDashboard() {
  const isDispatcherAdmin = useAuthStore((state) => Boolean(state.session?.user.isDispatcherAdmin));
  const dispatchers = useGetDispatchers();
  const createDispatcher = useCreateDispatcher();
  const updateDispatcher = useUpdateDispatcher();

  const mapDispatcherToForm = useCallback(
    (dispatcher: User) => ({
      fullName: dispatcher.fullName ?? "",
      phoneNumber: dispatcher.phoneNumber ?? "",
      email: dispatcher.email ?? "",
      passwordHash: "",
    }),
    []
  );

  const { isOpen, editing, form, openForCreate, openForEdit, onOpenChange, reset, updateForm } =
    useEntityFormDialog<User, DispatcherFormState>({
      initialForm,
      mapEntityToForm: mapDispatcherToForm,
    });

  const rows = useMemo(() => dispatchers.data ?? [], [dispatchers.data]);
  const columns = useMemo(() => createDispatcherColumns(), []);

  const handleSubmit = useCallback(async () => {
    const payload = {
      fullName: form.fullName.trim(),
      phoneNumber: form.phoneNumber.trim(),
      email: form.email.trim(),
      passwordHash: form.passwordHash.trim(),
    } satisfies Partial<User>;

    if (editing) {
      await updateDispatcher.mutateAsync({
        id: editing.id,
        payload: {
          fullName: payload.fullName,
          phoneNumber: payload.phoneNumber,
          email: payload.email,
          passwordHash: payload.passwordHash || undefined,
        },
      });
    } else {
      await createDispatcher.mutateAsync(payload);
    }

    reset();
  }, [
    createDispatcher,
    editing,
    form.email,
    form.fullName,
    form.passwordHash,
    form.phoneNumber,
    reset,
    updateDispatcher,
  ]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dispatchers</h1>
          <p className="text-sm text-muted-foreground">Manage dispatcher accounts.</p>
        </div>
        {isDispatcherAdmin ? <Button onClick={openForCreate}>Add Dispatcher</Button> : null}
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        height={640}
        rowHeight={56}
        rowKey={(row) => row.id}
        onRowClick={isDispatcherAdmin ? openForEdit : undefined}
      />

      {isDispatcherAdmin && editing ? (
        <EditDispatcherDialog
          open={isOpen}
          form={form}
          onOpenChange={onOpenChange}
          onChange={updateForm}
          onSubmit={handleSubmit}
        />
      ) : isDispatcherAdmin ? (
        <CreateDispatcherDialog
          open={isOpen}
          form={form}
          providerAvailable={true}
          onOpenChange={onOpenChange}
          onChange={updateForm}
          onSubmit={handleSubmit}
        />
      ) : null}
    </div>
  );
}
