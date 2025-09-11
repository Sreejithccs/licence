import LicenseListing from "@/components/LicenseListing";

export default function AdminPage() {
  return (
    <LicenseListing 
      showAddButton={true}
      title="License Management"
    />
  );
}
