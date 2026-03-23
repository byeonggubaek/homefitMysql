import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useEffect, useState } from "react";
import { ChevronDownIcon } from "lucide-react"

import type { MenuPos } from "shared";
import { Link } from "react-router-dom";

interface WgodBreadcrumbProps {
  page : string
}
const WgodBreadcrumb = (
{ 
  page
}: WgodBreadcrumbProps) => 
{
  const [menuPos, setMenuPos] = useState<MenuPos>();
  useEffect(() => {
    fetch(`http://localhost:3001/api/get_menu_pos?page=${page}`)
      .then(res => res.json())
      .then(data => {
        setMenuPos(data.data);
      });
  }, [page]);

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">홈</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage >{menuPos?.nas_name}</BreadcrumbPage>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 text-focus">
                  {menuPos?.nas_name}
                  <ChevronDownIcon className="size-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuGroup>
                  {menuPos?.siblings.map((sib) => (
                    <DropdownMenuItem key={sib.nas_id}>
                      {sib.nas_id === menuPos.nas_id ? <span className="text-focus">{sib.nas_name}</span> : <Link to={sib.nas_href}>{sib.nas_name}</Link>}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>    
    </>
  )
};

export default WgodBreadcrumb;