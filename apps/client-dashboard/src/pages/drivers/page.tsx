import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { DataTable } from "@/components/VirtualizedTable";
import { Button } from "@/components/ui/button";
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

const initialForm: DriverFormState = {
  fullName: "",
  phoneNumber: "",
  email: "",
  passwordHash: "",
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
  const driverLocations = useMemo(
    () => driverLocationsQuery.data ?? {},
    [driverLocationsQuery.data]
  );

  const drivers = useGetDrivers();
  const createInvite = useCreateStaffInvite();
  const updateDriver = useUpdateDriver();
  const [invitePayload, setInvitePayload] = useState<{
    token: string;
    email: string;
    role: "DRIVER";
  } | null>(null);
  const mapDriverToForm = useCallback(
    (driver: User) => ({
      fullName: driver.fullName ?? "",
      phoneNumber: driver.phoneNumber ?? "",
      email: driver.email ?? "",
      passwordHash: "",
    }),
    []
  );
  const { isOpen, editing, form, openForCreate, openForEdit, onOpenChange, reset, updateForm } =
    useEntityFormDialog<User, DriverFormState>({
      initialForm,
      mapEntityToForm: mapDriverToForm,
    });

  const rows = useMemo(() => drivers.data ?? [], [drivers.data]);

  const columns = useMemo(
    () =>
      createDriverColumns({
        driverLocations,
      }),
    [driverLocations]
  );

  const handleSubmit = useCallback(async () => {
    const payload = {
      fullName: form.fullName.trim(),
      phoneNumber: form.phoneNumber.trim(),
      email: form.email.trim(),
      passwordHash: form.passwordHash.trim(),
    } satisfies Partial<User>;

    if (editing) {
      await updateDriver.mutateAsync({
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
        role: "DRIVER",
        email: payload.email,
      });
      setInvitePayload({
        token: invite.inviteToken,
        email: payload.email,
        role: "DRIVER",
      });
    }

    reset();
  }, [
    createInvite,
    editing,
    form.email,
    form.fullName,
    form.passwordHash,
    form.phoneNumber,
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
        {isDispatcherAdmin ? <Button onClick={openForCreate}>Add Driver</Button> : null}
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
        <EditDriverDialog
          open={isOpen}
          form={form}
          onOpenChange={onOpenChange}
          onChange={updateForm}
          onSubmit={handleSubmit}
        />
      ) : isDispatcherAdmin ? (
        <CreateDriverDialog
          open={isOpen}
          form={form}
          providerAvailable={true}
          onOpenChange={onOpenChange}
          onChange={updateForm}
          onSubmit={handleSubmit}
        />
      ) : null}

      {invitePayload ? (
        <div className="rounded-md border p-4 space-y-2">
          <h3 className="font-semibold">Driver Onboarding Invite</h3>
          <p className="text-sm text-muted-foreground">
            Assigned email: {invitePayload.email}
          </p>
          <p className="text-xs break-all">Invite token: {invitePayload.token}</p>
          <img
            alt="Driver invite QR"
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
