import { useCallback, useMemo, useState } from "react";
import {
  useGetAmbulances,
  useCreateAmbulance,
  useUpdateAmbulance,
} from "@/services/ambulance.service";
import { DataTable } from "@/components/VirtualizedTable";
import { Button } from "@/components/ui/button";
import { useEntityFormDialog } from "@/hooks/use-entity-form-dialog";
import type { Ambulance } from "@/lib/types";
import { createAmbulanceColumns } from "@/pages/ambulances/components/ambulance-columns";
import {
  CreateAmbulanceDialog,
  EditAmbulanceDialog,
  type AmbulanceFormState,
} from "@/pages/ambulances/components/AmbulanceFormDialog";
import { toUiErrorMessage } from "@/lib/ui-error";

const initialForm: AmbulanceFormState = {
  vehicleNumber: "",
  equipmentLevel: "",
  status: "AVAILABLE",
};

export default function AmbulancesDashboard() {
  const ambulances = useGetAmbulances();
  const createAmbulance = useCreateAmbulance();
  const updateAmbulance = useUpdateAmbulance();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
  const handleOpenForCreate = useCallback(() => {
    setFormError(null);
    openForCreate();
  }, [openForCreate]);
  const handleOpenForEdit = useCallback(
    (ambulance: Ambulance) => {
      setFormError(null);
      openForEdit(ambulance);
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
    <K extends keyof AmbulanceFormState>(field: K, value: AmbulanceFormState[K]) => {
      if (formError) {
        setFormError(null);
      }
      updateForm(field, value);
    },
    [formError, updateForm]
  );

  const rows = useMemo(() => ambulances.data ?? [], [ambulances.data]);

  const columns = useMemo(() => createAmbulanceColumns(), []);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setFormError(null);
    setIsSubmitting(true);
    const payload = {
      vehicleNumber: form.vehicleNumber.trim(),
      equipmentLevel: form.equipmentLevel.trim() || undefined,
      status: form.status,
    } satisfies Partial<Ambulance>;

    try {
      if (editing) {
        const updatePayload = { ...payload, providerId: undefined };
        await updateAmbulance.mutateAsync({ id: editing.id, payload: updatePayload });
      } else {
        await createAmbulance.mutateAsync(payload);
      }

      reset();
    } catch (error) {
      setFormError(toUiErrorMessage(error, "Failed to save ambulance. Please review your inputs."));
    } finally {
      setIsSubmitting(false);
    }
  }, [
    createAmbulance,
    editing,
    form.equipmentLevel,
    form.status,
    form.vehicleNumber,
    isSubmitting,
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
        <Button onClick={handleOpenForCreate}>
          Add Ambulance
        </Button>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        height={640}
        rowHeight={56}
        rowKey={(row) => row.id}
        onRowClick={handleOpenForEdit}
      />

      {editing ? (
        <EditAmbulanceDialog
          open={isOpen}
          form={form}
          onOpenChange={handleDialogOpenChange}
          onChange={handleFormChange}
          onSubmit={handleSubmit}
          errorMessage={formError}
          isSubmitting={isSubmitting}
        />
      ) : (
        <CreateAmbulanceDialog
          open={isOpen}
          form={form}
          providerAvailable={true}
          onOpenChange={handleDialogOpenChange}
          onChange={handleFormChange}
          onSubmit={handleSubmit}
          errorMessage={formError}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
