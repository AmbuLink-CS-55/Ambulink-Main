import { useMemo, useState } from "react";
import {
  useGetAmbulances,
  useCreateAmbulance,
  useUpdateAmbulance,
} from "@/services/ambulance.service";
import { VirtualizedTable } from "@/components/VirtualizedTable";
import { Button } from "@/components/ui/button";
import type { Ambulance } from "@/lib/types";
import { createAmbulanceColumns } from "@/pages/ambulances/ambulance-columns";
import {
  AmbulanceFormDialog,
  type AmbulanceFormState,
} from "@/pages/ambulances/AmbulanceFormDialog";
import env from "@/../env";

const initialForm: AmbulanceFormState = {
  vehicleNumber: "",
  equipmentLevel: "",
  status: "AVAILABLE",
};

export default function AmbulancesDashboard() {
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Ambulance | null>(null);
  const [form, setForm] = useState<AmbulanceFormState>(initialForm);

  const ambulances = useGetAmbulances({ providerId: env.VITE_PROVIDER_ID });
  const createAmbulance = useCreateAmbulance();
  const updateAmbulance = useUpdateAmbulance();

  const rows = useMemo(() => ambulances.data ?? [], [ambulances.data]);

  const columns = useMemo(
    () =>
      createAmbulanceColumns({
        onEdit: (ambulance) => {
          setEditing(ambulance);
          setForm({
            vehicleNumber: ambulance.vehicleNumber ?? "",
            equipmentLevel: ambulance.equipmentLevel ?? "",
            status: ambulance.status ?? "AVAILABLE",
          });
          setIsOpen(true);
        },
      }),
    []
  );

  const handleSubmit = async () => {
    const payload = {
      providerId: env.VITE_PROVIDER_ID,
      vehicleNumber: form.vehicleNumber.trim(),
      equipmentLevel: form.equipmentLevel.trim() || undefined,
      status: form.status,
    } satisfies Partial<Ambulance>;

    if (editing) {
      const updatePayload = { ...payload, providerId: undefined };
      await updateAmbulance.mutateAsync({ id: editing.id, payload: updatePayload });
    } else {
      if (!env.VITE_PROVIDER_ID) return;
      await createAmbulance.mutateAsync(payload);
    }

    setIsOpen(false);
    setEditing(null);
    setForm(initialForm);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Ambulances</h1>
          <p className="text-sm text-muted-foreground">Manage your fleet.</p>
        </div>
        <Button onClick={() => setIsOpen(true)} disabled={!env.VITE_PROVIDER_ID}>
          Add Ambulance
        </Button>
      </div>

      <VirtualizedTable columns={columns} rows={rows} height={640} rowHeight={56} />

      <AmbulanceFormDialog
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
        onChange={(field, value) =>
          setForm((prev) => ({
            ...prev,
            [field]: field === "status" ? (value as AmbulanceFormState["status"]) : value,
          }))
        }
        onSubmit={handleSubmit}
      />
    </div>
  );
}
