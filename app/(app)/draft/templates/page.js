import AppShell from "@/components/layout/AppShell";
import Topbar from "@/components/layout/Topbar";
import TemplateBankWorkspace from "@/components/draft/TemplateBankWorkspace";
import GoBackButton from "@/components/draft/GoBackButton";

export default function TemplateBankPage() {
  return (
    <AppShell>
      <Topbar leftSlot={<GoBackButton />} />
      <TemplateBankWorkspace />
    </AppShell>
  );
}
