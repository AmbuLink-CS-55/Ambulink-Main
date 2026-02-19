import { useMemo, useState } from "react";
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
import { useSocketStore } from "@/hooks/use-socket-store";
import { useDriverStore } from "@/hooks/use-driver-store";
import { useCreateDriver, useGetDrivers, useUpdateDriver } from "@/services/driver.service";
import type { User, UserStatus } from "@/lib/types";
import env from "@/../env";

type DriverFormState = {
  fullName: string;
  phoneNumber: string;
  email: string;
  passwordHash: string;
};

function onlineBadge(status: UserStatus | null | undefined) {
  if (status === "AVAILABLE") return { label: "Online", variant: "success" as const };
  if (status === "BUSY") return { label: "Busy", variant: "secondary" as const };
  return { label: "Offline", variant: "outline" as const };
}

export default function DriversDashboard() {
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<DriverFormState>({
    fullName: "",
    phoneNumber: "",
    email: "",
    passwordHash: "",
  });

  const socketConnected = useSocketStore((state) => state.isConnected);
  const driverLocations = useDriverStore((state) => state.driverLocations);

  const drivers = useGetDrivers({ providerId: env.VITE_PROVIDER_ID });
  const createDriver = useCreateDriver();
  const updateDriver = useUpdateDriver();

  const rows = useMemo(() => drivers.data ?? [], [drivers.data]);

  const columns = useMemo(
    () => [
      {
        header: "Driver",
        width: "220px",
        cell: (row: User) => (
          <div>
            <div className="font-medium">{row.fullName ?? "Unnamed"}</div>
            <div className="text-xs text-muted-foreground">{row.id}</div>
          </div>
        ),
      },
      {
        header: "Contact",
        width: "220px",
        cell: (row: User) => (
          <div>
            <div>{row.phoneNumber ?? "-"}</div>
            <div className="text-xs text-muted-foreground">{row.email ?? "-"}</div>
          </div>
        ),
      },
      {
        header: "Status",
        width: "160px",
        cell: (row: User) => {
          const badge = onlineBadge(row.status ?? null);
          return <Badge variant={badge.variant}>{badge.label}</Badge>;
        },
      },
      {
        header: "Location",
        width: "180px",
        cell: (row: User) => {
          const location = driverLocations[row.id];
          if (!location) return <span className="text-muted-foreground">-</span>;
          return (
            <div className="text-xs text-muted-foreground">
              {location.x.toFixed(4)}, {location.y.toFixed(4)}
            </div>
          );
        },
      },
      {
        header: "Updated",
        width: "180px",
        cell: (row: User) => (row.updatedAt ? new Date(row.updatedAt).toLocaleString() : "-"),
      },
      {
        header: "Actions",
        width: "120px",
        cell: (row: User) => (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditing(row);
              setForm({
                fullName: row.fullName ?? "",
                phoneNumber: row.phoneNumber ?? "",
                email: row.email ?? "",
                passwordHash: "",
              });
              setIsOpen(true);
            }}
          >
            Edit
          </Button>
        ),
      },
    ],
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
      const updatePayload = {
        fullName: payload.fullName,
        phoneNumber: payload.phoneNumber,
        email: payload.email,
        passwordHash: payload.passwordHash || undefined,
      } satisfies Partial<User>;
      await updateDriver.mutateAsync({ id: editing.id, payload: updatePayload });
    } else {
      if (!env.VITE_PROVIDER_ID) return;
      await createDriver.mutateAsync(payload);
    }

    setIsOpen(false);
    setEditing(null);
    setForm({ fullName: "", phoneNumber: "", email: "", passwordHash: "" });
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Drivers</h1>
          <p className="text-sm text-muted-foreground">
            Manage your roster. Live updates: {socketConnected ? "on" : "off"}.
          </p>
        </div>
        <Button onClick={() => setIsOpen(true)}>Add Driver</Button>
      </div>

      <VirtualizedTable columns={columns} rows={rows} height={640} rowHeight={56} />

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Driver" : "Add Driver"}</DialogTitle>
            <DialogDescription>Provider cannot be changed.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 px-6">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input
                value={form.fullName}
                onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Phone Number</label>
              <Input
                value={form.phoneNumber}
                onChange={(e) => setForm((prev) => ({ ...prev, phoneNumber: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            {!editing && (
              <div className="grid gap-2">
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  value={form.passwordHash}
                  onChange={(e) => setForm((prev) => ({ ...prev, passwordHash: e.target.value }))}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !form.fullName.trim() ||
                !form.phoneNumber.trim() ||
                (!editing && !form.passwordHash.trim()) ||
                (!editing && !env.VITE_PROVIDER_ID)
              }
            >
              {editing ? "Save Changes" : "Create Driver"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
