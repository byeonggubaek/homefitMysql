import WdogBreadClum from "@/components/WdogBreadClum";
import SystemBackendMain from "@/sections/SystemBackendMain";

export default function SystemBackend() {

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-4">
        <WdogBreadClum page="SystemBackend"/> 
      </div>
      <div className="flex gap-4 w-full">
        <SystemBackendMain />
      </div>     
    </div>
  );
}