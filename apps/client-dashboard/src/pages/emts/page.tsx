import { useCallback, useMemo } from "react";
import { useState } from "react";
import { DataTable } from "@/components/VirtualizedTable";
import { Button } from "@/components/ui/button";
import { useEntityFormDialog } from "@/hooks/use-entity-form-dialog";
import { useGetEmts, useUpdateEmt } from "@/services/emt.service";
import type { User } from "@/lib/types";
import { createEmtColumns } from "@/pages/emts/components/emt-columns";
import {
  CreateEmtDialog,
  EditEmtDialog,
  type EmtFormState,
} from "@/pages/emts/components/EmtFormDialog";
import { useAuthStore } from "@/stores/auth.store";
import { useCreateStaffInvite } from "@/services/auth.service";
import { toUiErrorMessage } from "@/lib/ui-error";

const initialForm: EmtFormState = {
  fullName: "",
  phoneNumber: "",
  email: "",
  passwordHash: "",
};

export default function EmtsDashboard() {
  const isDispatcherAdmin = useAuthStore((state) => Boolean(state.session?.user.isDispatcherAdmin));
  const emts = useGetEmts();
  const updateEmt = useUpdateEmt();
  const createInvite = useCreateStaffInvite();
  const [invitePayload, setInvitePayload] = useState<{
    token: string;
    email: string;
    role: "EMT";
  } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  const handleOpenForCreate = useCallback(() => {
    setFormError(null);
    openForCreate();
  }, [openForCreate]);
  const handleOpenForEdit = useCallback(
    (emt: User) => {
      setFormError(null);
      openForEdit(emt);
    },
    [openForEdit]
  );
  const handleDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setFormError(null);
      }
      onOpenChange(open);
    },
    [onOpenChange]
  );
  const handleFormChange = useCallback(
    <K extends keyof EmtFormState>(field: K, value: EmtFormState[K]) => {
      if (formError) {
        setFormError(null);
      }
      updateForm(field, value);
    },
    [formError, updateForm]
  );

  const rows = useMemo(() => emts.data ?? [], [emts.data]);
  const columns = useMemo(() => createEmtColumns(), []);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setFormError(null);
    setIsSubmitting(true);
    const payload = {
      fullName: form.fullName.trim(),
      phoneNumber: form.phoneNumber.trim(),
      email: form.email.trim(),
      passwordHash: form.passwordHash.trim(),
    } satisfies Partial<User>;

    try {
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
        if (!payload.email) {
          throw new Error("Email is required to generate onboarding invite.");
        }
        const invite = await createInvite.mutateAsync({
          role: "EMT",
          email: payload.email,
        });
        setInvitePayload({
          token: invite.inviteToken,
          email: payload.email,
          role: "EMT",
        });
      }

      reset();
    } catch (error) {
      setFormError(toUiErrorMessage(error, "Failed to save EMT. Please review your inputs."));
    } finally {
      setIsSubmitting(false);
    }
  }, [
    createInvite,
    editing,
    form.email,
    form.fullName,
    form.passwordHash,
    form.phoneNumber,
    isSubmitting,
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
        {isDispatcherAdmin ? <Button onClick={handleOpenForCreate}>Add EMT</Button> : null}
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        height={640}
        rowHeight={56}
        rowKey={(row) => row.id}
        onRowClick={isDispatcherAdmin ? handleOpenForEdit : undefined}
      />

      {isDispatcherAdmin && editing ? (
        <EditEmtDialog
          open={isOpen}
          form={form}
          onOpenChange={handleDialogOpenChange}
          onChange={handleFormChange}
          onSubmit={handleSubmit}
          errorMessage={formError}
          isSubmitting={isSubmitting}
        />
      ) : isDispatcherAdmin ? (
        <CreateEmtDialog
          open={isOpen}
          form={form}
          providerAvailable={true}
          onOpenChange={handleDialogOpenChange}
          onChange={handleFormChange}
          onSubmit={handleSubmit}
          errorMessage={formError}
          isSubmitting={isSubmitting}
        />
      ) : null}

      {invitePayload ? (
        <div className="rounded-md border p-4 space-y-2">
          <h3 className="font-semibold">EMT Onboarding Invite</h3>
          <p className="text-sm text-muted-foreground">
            Assigned email: {invitePayload.email}
          </p>
          <p className="text-xs break-all">Invite token: {invitePayload.token}</p>
          <img
            alt="EMT invite QR"
            className="h-40 w-40 rounded border"
            src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
              JSON.stringify({
                type: "staff_invite",
                role: invitePayload.role,
                inviteToken: invitePayload.token,
                invitedEmail: invitePayload.email,
              })
            )}`}
          />
        </div>
      ) : null}
    </div>
  );
}
