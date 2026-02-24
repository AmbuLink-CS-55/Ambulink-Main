import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { VirtualizedTable } from "@/components/VirtualizedTable";
import { Button } from "@/components/ui/button";
import { queryKeys } from "@/lib/queryKeys";
import { useCreateDriver, useGetDrivers, useUpdateDriver } from "@/services/driver.service";
import type { User } from "@/lib/types";
import { createDriverColumns } from "@/pages/drivers/driver-columns";
import { DriverFormDialog, type DriverFormState } from "@/pages/drivers/DriverFormDialog";
import env from "@/../env";

const initialForm: DriverFormState = {
  fullName: "",
  phoneNumber: "",
  email: "",
  passwordHash: "",
};

export default function DriversDashboard() {
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<DriverFormState>(initialForm);

  const queryClient = useQueryClient();
  const driverLocations =
    queryClient.getQueryData<Record<string, { x: number; y: number }>>(queryKeys.driverLocations()) ?? {};

  const drivers = useGetDrivers({ providerId: env.VITE_PROVIDER_ID });
  const createDriver = useCreateDriver();
  const updateDriver = useUpdateDriver();

  const rows = useMemo(() => drivers.data ?? [], [drivers.data]);

  const columns = useMemo(
    () =>
      createDriverColumns({
        driverLocations,
        onEdit: (driver) => {
          setEditing(driver);
          setForm({
            fullName: driver.fullName ?? "",
            phoneNumber: driver.phoneNumber ?? "",
            email: driver.email ?? "",
            passwordHash: "",
          });
          setIsOpen(true);
        },
      }),
    [driverLocations]
  );

  const handleSubmit = async () => {
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

    setIsOpen(false);
    setEditing(null);
    setForm(initialForm);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Drivers</h1>
          <p className="text-sm text-muted-foreground">Manage your roster.</p>
        </div>
        <Button onClick={() => setIsOpen(true)}>Add Driver</Button>
      </div>

      <VirtualizedTable columns={columns} rows={rows} height={640} rowHeight={56} />

      <DriverFormDialog
        open={isOpen}
        editing={editing !== null}
        form={form}
        providerAvailable={Boolean(env.VITE_PROVIDER_ID)}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            setEditing(null);
            setForm(initialForm);
          }
        }}
        onChange={(field, value) => setForm((prev) => ({ ...prev, [field]: value }))}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
