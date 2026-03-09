import { useCallback, useMemo } from "react";
import { DataTable } from "@/components";
import { Button } from "@/components/ui/button";
import { useEntityFormDialog } from "@/hooks/use-entity-form-dialog";
import { useCreateEmt, useGetEmts, useUpdateEmt } from "@/services/emt.service";
import type { User } from "@/lib/types";
import { createEmtColumns } from "@/pages/emts/components/emt-columns";
import {
  CreateEmtDialog,
  EditEmtDialog,
  type EmtFormState,
} from "@/pages/emts/components/EmtFormDialog";
import env from "@/../env";

const initialForm: EmtFormState = {
  fullName: "",
  phoneNumber: "",
  email: "",
  passwordHash: "",
};

export default function EmtsDashboard() {
  const emts = useGetEmts({ providerId: env.VITE_PROVIDER_ID });
  const createEmt = useCreateEmt();
  const updateEmt = useUpdateEmt();

  const mapEmtToForm = useCallback(
    (emt: User) => ({
      fullName: emt.fullName ?? "",
      phoneNumber: emt.phoneNumber ?? "",
      email: emt.email ?? "",
      passwordHash: "",
    }),
    []
  );

  const { isOpen, editing, form, openForCreate, openForEdit, onOpenChange, reset, updateForm } =
    useEntityFormDialog<User, EmtFormState>({
      initialForm,
      mapEntityToForm: mapEmtToForm,
    });

  const rows = useMemo(() => emts.data ?? [], [emts.data]);
  const columns = useMemo(() => createEmtColumns(), []);

  const handleSubmit = useCallback(async () => {
    const payload = {
      fullName: form.fullName.trim(),
      phoneNumber: form.phoneNumber.trim(),
      email: form.email.trim(),
      passwordHash: form.passwordHash.trim(),
      providerId: env.VITE_PROVIDER_ID,
    } satisfies Partial<User>;

    if (editing) {
      await updateEmt.mutateAsync({
        id: editing.id,
        payload: {
          fullName: payload.fullName,
          phoneNumber: payload.phoneNumber,
          email: payload.email,
          passwordHash: payload.passwordHash || undefined,
        },
      });
    } else {
      if (!env.VITE_PROVIDER_ID) return;
      await createEmt.mutateAsync(payload);
    }

    reset();
  }, [
    createEmt,
    editing,
    form.email,
    form.fullName,
    form.passwordHash,
    form.phoneNumber,
    reset,
    updateEmt,
  ]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">EMTs</h1>
          <p className="text-sm text-muted-foreground">Manage your EMT roster.</p>
        </div>
        <Button onClick={openForCreate}>Add EMT</Button>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        height={640}
        rowHeight={56}
        rowKey={(row) => row.id}
        onRowClick={openForEdit}
      />

      {editing ? (
        <EditEmtDialog
          open={isOpen}
          form={form}
          onOpenChange={onOpenChange}
          onChange={updateForm}
          onSubmit={handleSubmit}
        />
      ) : (
        <CreateEmtDialog
          open={isOpen}
          form={form}
          providerAvailable={Boolean(env.VITE_PROVIDER_ID)}
          onOpenChange={onOpenChange}
          onChange={updateForm}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
