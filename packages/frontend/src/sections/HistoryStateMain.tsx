import { useCallback, useEffect, useState } from "react";
import { createWorkoutChartConfig, createWorkoutChartConfigWithPlan } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { ChartConfig } from "@/components/ui/chart";
import type { ColDesc, WorkoutRecord, WorkoutRecordWithPlan } from 'shared';

import WdogTable from "@/components/WdogTable";
import WdogChartBar from "@/components/WdogChartBar";
import WdogChartBarStackedWithLegend from "@/components/WdogChartBarStackedWithLegend";
import WdogChartPie from "@/components/WdogChartPie";
import WdogInputDateTermState from "@/components/WdogInputDateTermState";
import { format, addDays, startOfMonth, endOfMonth } from "date-fns";
import { type DateRange } from 'react-day-picker';
import { useUser } from "@/hooks/UserContext";

export default function HistoryStateMain() {  
  const { member } = useUser();  // Context에서 공유
  //================================================================================================================
  // 기준 데이터
  //================================================================================================================
  // 색상 정보 (차트 및 테이블에서 일관되게 사용)
  const colors: string[] = ['bg-table-1', 'bg-table-2', 'bg-table-3', 'bg-table-4', 'bg-table-5'];
  const today = new Date();
  // 날짜 범위 상태 (초기값: 오늘 기준 7일전부터 오늘까지)
  const [dateRange, setDateRange] = useState<DateRange>({
    from: addDays(today, -7), // 7일전
    to: today,  
  });
  const [dateDescription, setDateDescription] = useState<string>(`${format(dateRange.from!, 'yyyy-MM-dd')} ~ ${format(dateRange.to!, 'yyyy-MM-dd')}`);
  const handleDateChange = useCallback((dateRange: DateRange) => {
    setDateRange(dateRange);
    setDateDescription(`${format(dateRange.from!, 'yyyy-MM-dd')} ~ ${format(dateRange.to!, 'yyyy-MM-dd')}`);
  }, [])
  //================================================================================================================
  // 테이블 컬럼 정보 가져오기
  //================================================================================================================
  const [columnsRecord, setColumnsRecord] = useState<ColDesc[]>([]);
  const [columnsWithPlan, setColumnsWithPlan] = useState<ColDesc[]>([]);
  useEffect(() => {
    // 일별 상세 테이블 
    fetch('http://localhost:3001/api/getColDesc?table=WorkoutRecord')
      .then(res => res.json())
      .then(data => {
        setColumnsRecord(data.data);  
      });
    // 일별 성취 테이블
    fetch('http://localhost:3001/api/getColDesc?table=WorkoutAchievement')
      .then(res => res.json())
      .then(data => {
        setColumnsWithPlan(data.data);  
      });      
  }, []);
  //================================================================================================================
  // 일별 실적 데이터 1번 탭 
  //================================================================================================================
  // 운동 기록 그리드 가져오기
  const [records, setRecords] = useState<WorkoutRecord[]>([]);
  const [chartConfig, setChartConfig] = useState<ChartConfig>({});
  const [chartData, setChartData] = useState<any[]>([]);
  
  useEffect(() => {
    if (!member?.MEM_ID || !dateRange.from || !dateRange.to) return;

    const memId = member.MEM_ID;
    const startDt = format(dateRange.from, 'yyyy-MM-dd');
    const endDt = format(dateRange.to, 'yyyy-MM-dd');

    const fetchData = async () => {
      try {
        // API 경로 정의
        const gridUrl  = `http://localhost:3001/api/workout/getWorkoutRecords?mem_id=${memId}&from_dt=${startDt}&to_dt=${endDt}`;
        const chartUrl = `http://localhost:3001/api/workout/getWorkoutRecordsByPivot?mem_id=${memId}&from_dt=${startDt}&to_dt=${endDt}`;

        // Promise.all로 병렬 호출
        const [gridRes, chartRes] = await Promise.all([
          fetch(gridUrl),
          fetch(chartUrl),
        ]);
        console.log("gridRes:", gridRes);

        const gridJson = await gridRes.json();
        const chartJson = await chartRes.json();
        // 그리드 데이터 업데이트 1,3번 탭
        if (gridJson.success) {
          setRecords(gridJson.data);
        }
        // 일별 운동 추이 차트 데이터 및 설정 업데이트 1 탭
        if (chartJson.success) {
          setChartData(chartJson.data);
          const config = createWorkoutChartConfig(chartJson.columns, colors);
          setChartConfig(config);
        }
      } catch (error) {
        console.error("Data fetching failed:", error);
      }
    };

    fetchData();
  }, [member?.MEM_ID, dateRange.from, dateRange.to]);    
  //================================================================================================================
  // 일별 실적 데이터 2번 탭
  //================================================================================================================
   // 계획대비실적 그리드 가져오기 2번 탭  
  const [recordsWithPlan, setRecordsWithPlan] = useState<WorkoutRecordWithPlan[]>([]);  
  const [chartConfigWithPlan, setChartConfigWithPlan] = useState<ChartConfig>({});
  const [chartDataWithPlan, setChartDataWithPlan] = useState<any[]>([]);
  useEffect(() => {
    if (!member?.MEM_ID || !dateRange.from || !dateRange.to) return;

    const memId = member.MEM_ID;
    const startDt = format(dateRange.from, 'yyyy-MM-dd');
    const endDt = format(dateRange.to, 'yyyy-MM-dd');

    const fetchData = async () => {
      try {
        // API 경로 정의
        const gridWithPlanUrl = `http://localhost:3001/api/workout/getWorkoutRecordsWithPlan?mem_id=${memId}&from_dt=${startDt}&to_dt=${endDt}`;
        const chartWithPlanUrl = `http://localhost:3001/api/workout/getWorkoutRecordsWithPlanByPivot?mem_id=${memId}&from_dt=${startDt}&to_dt=${endDt}`;

        // Promise.all로 병렬 호출
        const [gridWithPlanRes, chartWithPlanRes] = await Promise.all([
          fetch(gridWithPlanUrl),
          fetch(chartWithPlanUrl)
        ]);
        const gridWithPlanJson = await gridWithPlanRes.json();
        const chartWithPlanJson = await chartWithPlanRes.json();
        if (gridWithPlanJson.success) {
          setRecordsWithPlan(gridWithPlanJson.data);
        }        
        console.log("chartWithPlanJson:", chartWithPlanJson);
        // 계획 대비 실적 차트 데이터 및 설정 업데이트 2번 탭
        if (chartWithPlanJson.success) {
          setChartDataWithPlan(chartWithPlanJson.data);
          const config = createWorkoutChartConfigWithPlan(chartWithPlanJson.columns, colors);
          setChartConfigWithPlan(config);
        }        
      } catch (error) {
        console.error("Data fetching failed:", error);
      }
    };

    fetchData();
  }, [member?.MEM_ID, dateRange.from, dateRange.to]);
  //================================================================================================================
  // 월별 데이터 3번 탭
  //================================================================================================================
  // 날짜 범위 상태 (초기값: 이번 달)
  const [dateRangeMonthly, setDateRangeMonthly] = useState<DateRange>({
    from: startOfMonth(today),
    to: endOfMonth(today),  // 이번 달의 마지막 날
  });  
  const [dateDescriptionMonthly, setDateDescriptionMonthly] = useState<string>(`${format(dateRangeMonthly.from!, 'yyyy-MM-dd')} ~ ${format(dateRangeMonthly.to!, 'yyyy-MM-dd')}`);
  const handleDateChangeMonthly = useCallback((dateRange: DateRange) => {
    setDateRangeMonthly(dateRange);
    setDateDescriptionMonthly(`${format(dateRange.from!, 'yyyy-MM-dd')} ~ ${format(dateRange.to!, 'yyyy-MM-dd')}`);
  }, [])
  // 운동 기록 데이터 가져오기 3번 탭
  const [recordsMonthly, setRecordsMonthly] = useState<WorkoutRecord[]>([]);  
  // 차트 데이터 및 설정 가져오기 3번 탭
  const [chartDataMonthly, setChartDataMonthly] = useState<any[]>([]);

  useEffect(() => {
    if (!member?.MEM_ID || !dateRangeMonthly.from || !dateRangeMonthly.to) return;

    const memId = member.MEM_ID;
    const startDt = format(dateRangeMonthly.from, 'yyyy-MM-dd');
    const endDt = format(dateRangeMonthly.to, 'yyyy-MM-dd');

    const fetchData = async () => {
      try {
        // API 경로 정의
        const gridUrl  = `http://localhost:3001/api/workout/getWorkoutRecords?mem_id=${memId}&from_dt=${startDt}&to_dt=${endDt}`;
        const chartUrl = `http://localhost:3001/api/workout/getWorkoutRecordsByPivot?mem_id=${memId}&from_dt=${startDt}&to_dt=${endDt}`;

        // Promise.all로 병렬 호출
        const [gridRes, chartRes] = await Promise.all([
          fetch(gridUrl),
          fetch(chartUrl),
        ]);
        const gridJson = await gridRes.json();
        const chartJson = await chartRes.json();
        // 그리드 데이터 업데이트
        if (gridJson.success) {
          setRecordsMonthly(gridJson.data);
        }
        // 차트 데이터 및 설정 업데이트
        if (chartJson.success) {
          const mothlyData = chartJson.data.map((item: any) => {
            const { wo_dt, ...rest } = item;  // wo_dt 제외하고 나머지 복사
            return rest;
          });
          setChartDataMonthly(mothlyData);          
        }
      } catch (error) {
        console.error("Data fetching failed:", error);
      }
    };

    fetchData();    
  }, [member?.MEM_ID, dateRangeMonthly.from, dateRangeMonthly.to]);   
  //================================================================================================================
  // 탭 이벤트 
  //================================================================================================================
  const [curTab, setCurrentTab] = useState<string>("record");    
  const handleTabChange = (value: string) => {
    setCurrentTab(value);
  };  
  return (
    <>
      <div className="flex gap-5 border p-1 rounded-lg bg-condition border-primary">
         {curTab !== 'monthly' && (
          <WdogInputDateTermState title="운동기간(일)" from_dt={dateRange.from} to_dt={dateRange.to} onDateChange={handleDateChange}/>
         )}
        {curTab === 'monthly' && (
          <WdogInputDateTermState title="운동기간(월)" from_dt={dateRangeMonthly.from} to_dt={dateRangeMonthly.to} onDateChange={handleDateChangeMonthly} />
        )}
      </div>
      <div>
        { records && 
          <Tabs defaultValue="record" className="w-full" onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="record">일별 상세</TabsTrigger>
              <TabsTrigger value="achievement">일별 성취</TabsTrigger>
              <TabsTrigger value="monthly">월별 운동내역</TabsTrigger>            
            </TabsList>
            <TabsContent value="record">  
              <div className="flex gap-4">
                <div className="w-1/2 border rounded-lg p-4 mb-4">
                  <WdogTable columns={columnsRecord} records={records} caption="일별 상세" colors={colors}/>
                </div>
                <div className="w-1/2 border rounded-lg p-4 mb-4 ">
                  <WdogChartBar 
                    chartData={chartData} 
                    chartConfig={chartConfig}
                    xAxisKey="wo_dt"
                    title="일별 운동 추이"
                    description={`${dateDescription} : 단위 횟수`}
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="achievement">
              <div className="flex gap-4">            
                <div className="w-1/2 border rounded-lg p-4 mb-4">
                  <WdogTable columns={columnsWithPlan} records={recordsWithPlan} caption="일별 성취" colors={colors}/>
                </div>        
                <div className="w-1/2 border rounded-lg p-4 mb-4">
                  <WdogChartBarStackedWithLegend 
                    chartData={chartDataWithPlan} 
                    chartConfig={chartConfigWithPlan}
                    xAxisKey="wo_dt"
                    title="일별 운동 (계획 대비 실적)"
                    description={`${dateDescription} : 단위 횟수`}
                  />
                </div>
              </div>              
            </TabsContent>
            <TabsContent value="monthly">
              <div className="flex gap-4">            
                <div className="w-1/2 border rounded-lg p-4 mb-4">
                  <WdogChartPie 
                    chartData={chartDataMonthly} 
                    chartConfig={chartConfig}
                    title="월별 운동 집계"
                    description={`${dateDescriptionMonthly} : 단위 횟수`}
                    circle_detail="총 운동횟수"            
                  />                
                </div>        
                <div className="w-1/2 border rounded-lg p-4 mb-4">
                  <WdogTable columns={columnsRecord} records={recordsMonthly} caption="월별 상세" colors={colors}/>
                </div>
              </div>              
            </TabsContent>          
          </Tabs>  
        }      
      </div>
    </>
  );
}

