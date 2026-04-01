import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { ColDesc } from 'shared';
import { formatCurrency, formatNumber, formatPrice, formatDate, formatTime } from "@/lib/utils";

interface WdogTableProps {
  columns: ColDesc[];
  records: any[];
  caption: string;
  colors?: string[]; // 
  onRowClick?: (record: any) => void; // 
}

const WdogTable = ({ 
  columns, 
  records, 
  caption, 
  colors = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5'],
  onRowClick }: WdogTableProps) => {
  if (columns.length === 0) {
    return <div>Loading...</div>;
  }
  let totalAmount = 0;
  let totalQty = 0;
  columns.map((column) => {
      switch (column.COL_SUM) {
        case 'max':
          column.COL_AGG = records.reduce((max, record) => {
            const value = record[column.COL_ID as keyof typeof record] as number;
            return value > max ? value : max;
          }, Number.MIN_VALUE);
          break;
        case 'min':
          column.COL_AGG = records.reduce((min, record) => {
            const value = record[column.COL_ID as keyof typeof record] as number;
            return value < min ? value : min;
          }, Number.MAX_VALUE);  
          break;
        case 'avg':
          column.COL_AGG = records.reduce((sum, record) => {
            const value = record[column.COL_ID as keyof typeof record] as number;
            return sum + value;
          }, 0) / records.length;
          break;
        case 'sum':
          column.COL_AGG = records.reduce((sum, record) => {
            const value = record[column.COL_ID as keyof typeof record] as number;
            return sum + value;
          }, 0);
          switch(column.COL_ID){
            case 'amount':
              totalAmount = column.COL_AGG ?? 0;
              break;
            case 'qty':
              totalQty = column.COL_AGG ?? 0;
              break;
            default:
              break;  
          }
          break;
        default:
          break;
      }
    });
  columns.map((column) => {
    if (column.COL_ID == "price" && totalQty > 0) {
      column.COL_AGG = totalAmount / totalQty;
    }
  });

  return (
    <div>
      <Table>
        <TableCaption>{caption}</TableCaption>
        <TableHeader className="bg-secondary text-primary-foreground">
          <TableRow>
            {columns.map((column) => {
              let classAdjust = "";
              switch (column.COL_TYPE) {
                case 'qty':
                case 'prc':
                case 'amt':
                  classAdjust = "text-right"
                  break
                case 'dat':
                case 'tim':
                  classAdjust = "text-center"
                  break
                default:
                  classAdjust = "text-left"
                  break;       
              }              
              return (
                <TableHead key={column.COL_ID} className={classAdjust} style={{ width: column.COL_WIDTH }}>{column.COL_NAME }</TableHead>      
              )          
            })}     
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record, index) => (
            <TableRow key={`workout-${index}`} onClick={() => onRowClick?.(record)} className="cursor-pointer hover:bg-secondary/50">
              {columns.map((column) => {
                let classAdjust = "";
                let fmtValue = ""
                let listValue= "";
                switch (column.COL_TYPE) { 
                  case 'key':
                    classAdjust = "font-medium"
                    break
                  case 'qty':
                    classAdjust = "text-right"
                    fmtValue = formatNumber(record[column.COL_ID as keyof typeof record] as number)
                    break
                  case 'prc':
                    classAdjust = "text-right"
                    fmtValue = formatPrice(record[column.COL_ID as keyof typeof record] as number)
                    break
                  case 'amt':
                    classAdjust = "text-right"
                    fmtValue = formatCurrency(record[column.COL_ID as keyof typeof record] as number)
                    break
                  case 'dat':
                    classAdjust = "text-center"
                    fmtValue = formatDate(record[column.COL_ID as keyof typeof record] as number)
                    break
                  case 'tim':
                    classAdjust = "text-center"
                    fmtValue = formatTime(record[column.COL_ID as keyof typeof record] as number)
                    break
                  case 'lst':
                    classAdjust = ""
                    listValue = String(record[column.COL_ID + '_COLOR' as keyof typeof record]);
                    if(colors && listValue) {
                      listValue = `${colors[parseInt(listValue)]} rounded px-2 py-1`;
                    }
                    break;  
                  default:
                    classAdjust = "text-left"
                    break;                           
                }  
                const cellValue = fmtValue || String(record[column.COL_ID as keyof typeof record]);
                return <TableCell key={`${column.COL_ID}-${index}`} className={classAdjust}><span className={listValue ? listValue : ""}>{cellValue}</span></TableCell>
              })}
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            {columns.map((column, index) => {
              let classAdjust = "";
              let fmtValue = ""              
              switch (column.COL_TYPE) {
                case 'key':
                  fmtValue = "합계";
                  break
                case 'qty':
                  classAdjust = "text-right"
                  fmtValue = formatNumber(column.COL_AGG as number);
                  break
                case 'prc':
                  classAdjust = "text-right"
                  fmtValue = formatPrice(column.COL_AGG as number);
                  break
                case 'amt':
                  classAdjust = "text-right"
                  fmtValue = formatCurrency(column.COL_AGG as number);
                  break
                case 'dat':
                case 'tim':
                  classAdjust = "text-center"
                  fmtValue = "";                  
                  break
                default:
                  classAdjust = "text-left"
                  fmtValue = "";
                  break;                  
              }          
              return (
                <TableCell key={`${column.COL_ID}-${index}`} className={classAdjust}>{fmtValue}</TableCell>      
              )          
            })}              
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
};

export default WdogTable;