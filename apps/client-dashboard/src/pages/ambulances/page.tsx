import { useCallback, useMemo } from "react";
import {
  useGetAmbulances,
  useCreateAmbulance,
  useUpdateAmbulance,
} from "@/services/ambulance.service";
import { DataTable } from "@/components";
import { Button } from "@/components/ui/button";
import { useEntityFormDialog } from "@/hooks/use-entity-form-dialog";
import type { Ambulance } from "@/lib/types";
import {
  createAmbulanceColumns,
  CreateAmbulanceDialog,
  EditAmbulanceDialog,
  type AmbulanceFormState,
} from "@/pages/ambulances/components";
import env from "@/../env";

const initialForm: AmbulanceFormState = {
  vehicleNumber: "",
  equipmentLevel: "",
  status: "AVAILABLE",
};

export default function AmbulancesDashboard() {
  const ambulances = useGetAmbulances({ providerId: env.VITE_PROVIDER_ID });
  const createAmbulance = useCreateAmbulance();
  const updateAmbulance = useUpdateAmbulance();
  const mapAmbulanceToForm = useCallback(
    (ambulance: Ambulance) => ({
      vehicleNumber: ambulance.vehicleNumber ?? "",
      equipmentLevel: ambulance.equipmentLevel ?? "",
      status: ambulance.status ?? "AVAILABLE",
    }),
    []
  );
  const { isOpen, editing, form, openForCreate, openForEdit, onOpenChange, reset, updateForm } =
    useEntityFormDialog<Ambulance, AmbulanceFormState>({
      initialForm,
      mapEntityToForm: mapAmbulanceToForm,
    });

  const rows = useMemo(() => ambulances.data ?? [], [ambulances.data]);

  const columns = useMemo(
    () =>
      createAmbulanceColumns({
        onEdit: openForEdit,
      }),
    [openForEdit]
  );

  const handleSubmit = useCallback(async () => {
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

    reset();
  }, [
    createAmbulance,
    editing,
    form.equipmentLevel,
    form.status,
    form.vehicleNumber,
    reset,
    updateAmbulance,
  ]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Ambulances</h1>
          <p className="text-sm text-muted-foreground">Manage your fleet.</p>
        </div>
        <Button onClick={openForCreate} disabled={!env.VITE_PROVIDER_ID}>
          Add Ambulance
        </Button>
      </div>

      <DataTable columns={columns} rows={rows} height={640} rowHeight={56} />

      {editing ? (
        <EditAmbulanceDialog
          open={isOpen}
          form={form}
          onOpenChange={onOpenChange}
          onChange={updateForm}
          onSubmit={handleSubmit}
        />
      ) : (
        <CreateAmbulanceDialog
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
