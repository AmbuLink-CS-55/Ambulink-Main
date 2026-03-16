import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { DataTable } from "@/components/VirtualizedTable";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEntityFormDialog } from "@/hooks/use-entity-form-dialog";
import { queryKeys } from "@/lib/queryKeys";
import { useGetDrivers, useUpdateDriver } from "@/services/driver.service";
import { useCreateStaffInvite } from "@/services/auth.service";
import type { User } from "@/lib/types";
import { createDriverColumns } from "@/pages/drivers/components/driver-columns";
import {
  CreateDriverDialog,
  EditDriverDialog,
  type DriverFormState,
} from "@/pages/drivers/components/DriverFormDialog";
import { useAuthStore } from "@/stores/auth.store";
import { toUiErrorMessage } from "@/lib/ui-error";

const initialForm: DriverFormState = {
  fullName: "",
  phoneNumber: "",
  email: "",
};

export default function DriversDashboard() {
  const isDispatcherAdmin = useAuthStore((state) => Boolean(state.session?.user.isDispatcherAdmin));
  const driverLocationsQuery = useQuery<Record<string, { x: number; y: number }>>({
    queryKey: queryKeys.driverLocations(),
    queryFn: async () => ({}),
    initialData: {},
    staleTime: Infinity,
    enabled: false,
  });
  const driverLocations = driverLocationsQuery.data ?? {};

  const drivers = useGetDrivers();
  const createInvite = useCreateStaffInvite();
  const updateDriver = useUpdateDriver();
  const [invitePayload, setInvitePayload] = useState<{
    token: string;
    email: string;
    role: "DRIVER";
  } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inviteModalOpen = Boolean(invitePayload);
  const mapDriverToForm = useCallback(
    (driver: User) => ({
      fullName: driver.fullName ?? "",
      phoneNumber: driver.phoneNumber ?? "",
      email: driver.email ?? "",
    }),
    []
  );
  const { isOpen, editing, form, openForCreate, openForEdit, onOpenChange, reset, updateForm } =
    useEntityFormDialog<User, DriverFormState>({
      initialForm,
      mapEntityToForm: mapDriverToForm,
    });
  const handleOpenForCreate = useCallback(() => {
    setFormError(null);
    openForCreate();
  }, [openForCreate]);
  const handleOpenForEdit = useCallback(
    (driver: User) => {
      setFormError(null);
      openForEdit(driver);
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
    <K extends keyof DriverFormState>(field: K, value: DriverFormState[K]) => {
      if (formError) {
        setFormError(null);
      }
      updateForm(field, value);
    },
    [formError, updateForm]
  );

  const rows = drivers.data ?? [];
  const columns = createDriverColumns({
    driverLocations,
  });

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setFormError(null);
    setIsSubmitting(true);
    const payload = {
      fullName: form.fullName.trim(),
      phoneNumber: form.phoneNumber.trim(),
      email: form.email.trim(),
    } satisfies Partial<User>;

    try {
      if (editing) {
        await updateDriver.mutateAsync({
          id: editing.id,
          payload: {
            fullName: payload.fullName,
            phoneNumber: payload.phoneNumber,
            email: payload.email,
          },
        });
      } else {
        if (!payload.email) {
          throw new Error("Email is required to generate onboarding invite.");
        }
        const invite = await createInvite.mutateAsync({
          role: "DRIVER",
          fullName: payload.fullName,
          phoneNumber: payload.phoneNumber,
          email: payload.email,
        });
        setInvitePayload({
          token: invite.inviteToken,
          email: payload.email,
          role: "DRIVER",
        });
      }

      reset();
    } catch (error) {
      setFormError(toUiErrorMessage(error, "Failed to save driver. Please review your inputs."));
    } finally {
      setIsSubmitting(false);
    }
  }, [
    createInvite,
    editing,
    form.email,
    form.fullName,
    form.phoneNumber,
    isSubmitting,
    reset,
    updateDriver,
  ]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Drivers</h1>
          <p className="text-sm text-muted-foreground">Manage your roster.</p>
        </div>
        {isDispatcherAdmin ? <Button onClick={handleOpenForCreate}>Add Driver</Button> : null}
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
        <EditDriverDialog
          open={isOpen}
          form={form}
          onOpenChange={handleDialogOpenChange}
          onChange={handleFormChange}
          onSubmit={handleSubmit}
          errorMessage={formError}
          isSubmitting={isSubmitting}
        />
      ) : isDispatcherAdmin ? (
        <CreateDriverDialog
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

      <Dialog open={inviteModalOpen} onOpenChange={(open) => (!open ? setInvitePayload(null) : null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Driver Onboarding Invite</DialogTitle>
            <DialogDescription>
              Assigned email: {invitePayload?.email ?? "N/A"}
            </DialogDescription>
          </DialogHeader>
          {invitePayload ? (
            <div className="space-y-2 px-6 pb-6">
              <p className="text-xs break-all text-muted-foreground">Invite token: {invitePayload.token}</p>
              <img
                alt="Driver invite QR"
                className="mx-auto h-56 w-56 rounded border"
                src={`https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(
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
        </DialogContent>
      </Dialog>
    </div>
  );
}
