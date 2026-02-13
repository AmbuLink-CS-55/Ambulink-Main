import { useParams } from "react-router-dom";

export default function PatientDetailsPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Patient Details</h1>
      <p className="text-muted-foreground">Viewing patient ID: {id}</p>
    </div>
  );
}
