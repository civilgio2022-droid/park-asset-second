
import React, { useState, useMemo, useRef } from 'react';
import { ParkAsset } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ReportGenerationProps {
  assets: ParkAsset[];
}

const ReportGeneration: React.FC<ReportGenerationProps> = ({ assets }) => {
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const reportContentRef = useRef<HTMLDivElement>(null);

  const filteredAssets = useMemo(() => {
    if (!startDate && !endDate) return [];
    return assets.filter(asset => {
      const assetDate = new Date(asset.registrationDate);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      
      if (start) start.setHours(0, 0, 0, 0);
      if (end) end.setHours(23, 59, 59, 999);

      if (start && assetDate < start) return false;
      if (end && assetDate > end) return false;
      return true;
    });
  }, [assets, startDate, endDate]);

  const handleDownloadPDF = async () => {
    const input = reportContentRef.current;
    if (!input || filteredAssets.length === 0) {
      alert("보고서로 출력할 데이터가 없습니다. 기간을 선택해주세요.");
      return;
    }

    try {
      // Use html2canvas to render the div to a canvas
      const canvas = await html2canvas(input, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      
      // Create a new PDF document
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = imgWidth / imgHeight;
      const height = pdfWidth / ratio;

      // Add the image to the PDF
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, height);
      
      // Save the PDF
      pdf.save(`park_asset_report_${startDate}_to_${endDate}.pdf`);
    } catch (error) {
      console.error("PDF 생성 중 오류 발생:", error);
      alert("PDF를 생성하는 데 실패했습니다.");
    }
  };

  const handleDownloadCSV = () => {
    if (filteredAssets.length === 0) {
      alert("CSV로 내보낼 데이터가 없습니다. 기간을 선택해주세요.");
      return;
    }

    const headers = ["ID", "자산명", "종류", "등록일시", "위도", "경도", "상태", "설명"];
    const rows = filteredAssets.map(asset => [
      asset.id,
      asset.name,
      asset.type,
      new Date(asset.registrationDate).toLocaleString('ko-KR'),
      asset.latitude,
      asset.longitude,
      asset.condition,
      `"${asset.description.replace(/"/g, '""')}"`
    ]);

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF" // BOM for Excel
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `park_asset_report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">보고서 생성 및 출력</h2>
      
      <div className="bg-gray-50 p-4 rounded-md mb-6 flex flex-wrap items-end gap-4">
        <div className="flex-grow">
          <label htmlFor="startDateReport" className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
          <input type="date" id="startDateReport" value={startDate} onChange={e => setStartDate(e.target.value)} max={today} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-park-green-500 focus:border-park-green-500" />
        </div>
        <div className="flex-grow">
          <label htmlFor="endDateReport" className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
          <input type="date" id="endDateReport" value={endDate} onChange={e => setEndDate(e.target.value)} max={today} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-park-green-500 focus:border-park-green-500" />
        </div>
        <div className="flex items-center space-x-2 pt-6">
          <button onClick={handleDownloadPDF} className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2H4a1 1 0 110-2V4zm5 4a1 1 0 100 2h2a1 1 0 100-2H9z" clipRule="evenodd" /></svg>
            PDF 다운로드
          </button>
          <button onClick={handleDownloadCSV} className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
            CSV 다운로드
          </button>
        </div>
      </div>
      
      <div id="report-content" ref={reportContentRef} className="p-4 border border-gray-200 rounded-md bg-white">
        <h3 className="text-xl font-bold text-center mb-2">공원 자산 보고서</h3>
        <p className="text-center text-gray-600 mb-6">
          {startDate && endDate ? `조회 기간: ${startDate} ~ ${endDate}` : '기간을 선택하여 자산 내역을 확인하세요.'}
        </p>

        {filteredAssets.length > 0 ? (
          <div className="space-y-4">
            {filteredAssets.map((asset, index) => (
              <div key={asset.id} className="p-4 border rounded-lg break-inside-avoid">
                <h4 className="text-lg font-semibold text-park-green-800 mb-3">{index + 1}. {asset.name} ({asset.type})</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div className="sm:col-span-2">
                    <p><strong>등록일시:</strong> {new Date(asset.registrationDate).toLocaleString('ko-KR')}</p>
                    <p><strong>상태:</strong> {asset.condition}</p>
                    <p><strong>위치:</strong> 위도 {asset.latitude?.toFixed(5)}, 경도 {asset.longitude?.toFixed(5)}</p>
                    <p className="mt-2"><strong>설명:</strong> {asset.description}</p>
                  </div>
                  <div className="space-y-2">
                    <img src={asset.photo} alt={asset.name} className="w-full rounded-md shadow-sm" />
                    <img src={asset.mapView} alt="위치도" className="w-full rounded-md shadow-sm" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-gray-500">
            <p>선택된 기간에 해당하는 자산이 없습니다.</p>
            <p className="text-sm">보고서를 생성하려면 조회 기간을 선택해주세요.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportGeneration;
