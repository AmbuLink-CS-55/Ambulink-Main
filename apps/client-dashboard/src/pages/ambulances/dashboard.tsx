import { useMemo, useState } from "react";
import {
  useGetAmbulances,
  useCreateAmbulance,
  useUpdateAmbulance,
} from "@/services/ambulance.service";
import { VirtualizedTable } from "@/components/VirtualizedTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useSocketStore } from "@/hooks/use-socket-store";
import type { Ambulance, AmbulanceStatus } from "@/lib/types";
import env from "@/../env";

const STATUS_OPTIONS = [
  { label: "Available", value: "AVAILABLE" },
  { label: "Busy", value: "BUSY" },
  { label: "Offline", value: "OFFLINE" },
] as const;

function statusVariant(status: string) {
  if (status === "AVAILABLE") return "success";
  if (status === "BUSY") return "secondary";
  return "outline";
}

export default function AmbulancesDashboard() {
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Ambulance | null>(null);
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [equipmentLevel, setEquipmentLevel] = useState("");
  const [status, setStatus] = useState<AmbulanceStatus>("AVAILABLE");
  const socketConnected = useSocketStore((state) => state.isConnected);

  const ambulances = useGetAmbulances({ providerId: env.VITE_PROVIDER_ID });
  const createAmbulance = useCreateAmbulance();
  const updateAmbulance = useUpdateAmbulance();

  const rows = useMemo(() => ambulances.data ?? [], [ambulances.data]);

  const columns = useMemo(
    () => [
      {
        header: "Vehicle",
        width: "200px",
        cell: (row: Ambulance) => (
          <div>
            <div className="font-medium">{row.vehicleNumber}</div>
            <div className="text-xs text-muted-foreground">{row.id}</div>
          </div>
        ),
      },
      {
        header: "Equipment",
        width: "180px",
        cell: (row: Ambulance) => row.equipmentLevel ?? "-",
      },
      {
        header: "Status",
        width: "140px",
        cell: (row: Ambulance) => <Badge variant={statusVariant(row.status)}>{row.status}</Badge>,
      },
      {
        header: "Updated",
        width: "180px",
        cell: (row: Ambulance) => (row.updatedAt ? new Date(row.updatedAt).toLocaleString() : "-"),
      },
      {
        header: "Actions",
        width: "120px",
        cell: (row: Ambulance) => (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditing(row);
              setVehicleNumber(row.vehicleNumber ?? "");
              setEquipmentLevel(row.equipmentLevel ?? "");
              setStatus(row.status ?? "AVAILABLE");
              setIsOpen(true);
            }}
          >
            Edit
          </Button>
        ),
      },
    ],
    []
  );

  const handleSubmit = async () => {
    const payload = {
      providerId: env.VITE_PROVIDER_ID,
      vehicleNumber: vehicleNumber.trim(),
      equipmentLevel: equipmentLevel.trim() || undefined,
      status,
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
    setVehicleNumber("");
    setEquipmentLevel("");
    setStatus("AVAILABLE");
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Ambulances</h1>
          <p className="text-sm text-muted-foreground">
            Manage your fleet. Live updates: {socketConnected ? "on" : "off"}.
          </p>
        </div>
        <Button onClick={() => setIsOpen(true)} disabled={!env.VITE_PROVIDER_ID}>
          Add Ambulance
        </Button>
      </div>

      <VirtualizedTable
        columns={columns}
        rows={rows}
        keyFn={(row) => row.id}
        height={640}
        rowHeight={56}
      />

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Ambulance" : "Add Ambulance"}</DialogTitle>
            <DialogDescription>Provider cannot be changed.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 px-6">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Vehicle Number</label>
              <Input value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Equipment Level</label>
              <Input value={equipmentLevel} onChange={(e) => setEquipmentLevel(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value as AmbulanceStatus)}
                options={[...STATUS_OPTIONS]}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!vehicleNumber.trim() || !env.VITE_PROVIDER_ID}
            >
              {editing ? "Save Changes" : "Create Ambulance"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
