import { useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { DataTable } from "@/components/VirtualizedTable";
import { Button } from "@/components/ui/button";
import { useEntityFormDialog } from "@/hooks/use-entity-form-dialog";
import { queryKeys } from "@/lib/queryKeys";
import { useCreateDriver, useGetDrivers, useUpdateDriver } from "@/services/driver.service";
import type { User } from "@/lib/types";
import { createDriverColumns } from "@/pages/drivers/components/driver-columns";
import {
  CreateDriverDialog,
  EditDriverDialog,
  type DriverFormState,
} from "@/pages/drivers/components/DriverFormDialog";
import env from "@/../env";

const initialForm: DriverFormState = {
  fullName: "",
  phoneNumber: "",
  email: "",
  passwordHash: "",
};

export default function DriversDashboard() {
  const queryClient = useQueryClient();
  const driverLocations = useMemo(
    () =>
      queryClient.getQueryData<Record<string, { x: number; y: number }>>(
        queryKeys.driverLocations()
      ) ?? {},
    [queryClient]
  );

  const drivers = useGetDrivers({ providerId: env.VITE_PROVIDER_ID });
  const createDriver = useCreateDriver();
  const updateDriver = useUpdateDriver();
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
        onEdit: openForEdit,
      }),
    [driverLocations, openForEdit]
  );

  const handleSubmit = useCallback(async () => {
    const payload = {
      fullName: form.fullName.trim(),
      phoneNumber: form.phoneNumber.trim(),
      email: form.email.trim(),
      passwordHash: form.passwordHash.trim(),
      providerId: env.VITE_PROVIDER_ID,
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
      if (!env.VITE_PROVIDER_ID) return;
      await createDriver.mutateAsync(payload);
    }

    reset();
  }, [
    createDriver,
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
        <Button onClick={openForCreate}>Add Driver</Button>
      </div>

      <DataTable columns={columns} rows={rows} height={640} rowHeight={56} />

      {editing ? (
        <EditDriverDialog
          open={isOpen}
          form={form}
          onOpenChange={onOpenChange}
          onChange={updateForm}
          onSubmit={handleSubmit}
        />
      ) : (
        <CreateDriverDialog
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
