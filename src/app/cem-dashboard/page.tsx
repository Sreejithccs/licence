import LicenseListing from "@/components/LicenseListing";

export default function CEMDashboard() {
  return (
    <LicenseListing 
      showAddButton={false}
      title="CEM License Management"
      hideCemColumn
    />
  );
}
