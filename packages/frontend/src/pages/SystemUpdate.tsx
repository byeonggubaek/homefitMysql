import WdogBreadClum from "@/components/WdogBreadClum";
import SystemUpdateMain from "@/sections/SystemUpdateMain";

export default function SystemUpdate() {

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-4">
        <WdogBreadClum page="SystemUpdate"/> 
      </div>
      <div className="flex gap-4 w-full">
        <SystemUpdateMain />
      </div>     
    </div>
  );
}