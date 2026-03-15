import { useCallback, useMemo, useState } from "react";
import { DataTable } from "@/components/VirtualizedTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEntityFormDialog } from "@/hooks/use-entity-form-dialog";
import { useGetDispatchers, useUpdateDispatcher } from "@/services/dispatcher.service";
import { useCreateStaffInvite } from "@/services/auth.service";
import type { User } from "@/lib/types";
import { createDispatcherColumns } from "@/pages/dispatchers/components/dispatcher-columns";
import {
  EditDispatcherDialog,
  type DispatcherFormState,
} from "@/pages/dispatchers/components/DispatcherFormDialog";
import { useAuthStore } from "@/stores/auth.store";
import { toUiErrorMessage } from "@/lib/ui-error";

const initialForm: DispatcherFormState = {
  fullName: "",
  phoneNumber: "",
  email: "",
  passwordHash: "",
};

export default function DispatchersDashboard() {
  const isDispatcherAdmin = useAuthStore((state) => Boolean(state.session?.user.isDispatcherAdmin));
  const dispatchers = useGetDispatchers();
  const updateDispatcher = useUpdateDispatcher();
  const createInvite = useCreateStaffInvite();
  const [inviteFullName, setInviteFullName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [copiedInviteLink, setCopiedInviteLink] = useState(false);

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

  const onCreateInvite = useCallback(async () => {
    setInviteError(null);
    setInviteLink(null);
    setCopiedInviteLink(false);
    try {
      const response = await createInvite.mutateAsync({
        role: "DISPATCHER",
        fullName: inviteFullName.trim(),
        email: inviteEmail.trim(),
      });
      const base = window.location.origin.replace(/\/+$/, "");
      setInviteLink(`${base}/login?inviteToken=${encodeURIComponent(response.inviteToken)}`);
    } catch (err) {
      console.error("[invite] create failed", err);
      setInviteError(toUiErrorMessage(err, "Failed to generate invite link."));
    }
  }, [createInvite, inviteEmail, inviteFullName]);

  const onCopyInviteLink = useCallback(async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopiedInviteLink(true);
      setTimeout(() => setCopiedInviteLink(false), 1500);
    } catch {
      setInviteError("Failed to copy invite link");
    }
  }, [inviteLink]);

  const handleSubmit = useCallback(async () => {
    const payload = {
      fullName: form.fullName.trim(),
      phoneNumber: form.phoneNumber.trim(),
      email: form.email.trim(),
      passwordHash: form.passwordHash.trim(),
    } satisfies Partial<User>;

    if (!editing) return;

    await updateDispatcher.mutateAsync({
      id: editing.id,
      payload: {
        fullName: payload.fullName,
        phoneNumber: payload.phoneNumber,
        email: payload.email,
        passwordHash: payload.passwordHash || undefined,
      },
    });

    reset();
  }, [
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
          <p className="text-sm text-muted-foreground">Manage dispatcher accounts and invite new dispatchers.</p>
        </div>
      </div>

      <div className="rounded-md border border-[color:var(--border)] bg-card p-4">
        <div className="mb-2 text-sm font-medium text-foreground">Add Dispatcher</div>
        {isDispatcherAdmin ? (
          <>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                placeholder="Dispatcher full name"
                value={inviteFullName}
                onChange={(event) => setInviteFullName(event.target.value)}
              />
              <Input
                type="email"
                placeholder="dispatcher@email.com"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
              />
              <Button
                onClick={() => void onCreateInvite()}
                disabled={createInvite.isPending || !inviteFullName.trim() || !inviteEmail.trim()}
              >
                {createInvite.isPending ? "Generating..." : "Add Dispatcher"}
              </Button>
            </div>
            {inviteLink ? (
              <div className="mt-3 rounded bg-muted/50 p-2 text-xs">
                <p className="break-all">{inviteLink}</p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={() => void onCopyInviteLink()}
                >
                  {copiedInviteLink ? "Copied" : "Copy Invite Link"}
                </Button>
              </div>
            ) : null}
            {inviteError ? <p className="mt-2 text-xs text-destructive">{inviteError}</p> : null}
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            Only organization admin dispatchers can add new dispatchers.
          </p>
        )}
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
      ) : null}
    </div>
  );
}
