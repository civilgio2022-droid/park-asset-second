import React, { useState, useMemo } from 'react';
import { ParkAsset } from '../types.ts';

interface ReportGenerationProps {
  assets: ParkAsset[];
}

const ReportGeneration: React.FC<ReportGenerationProps> = ({ assets }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      if (!startDate && !endDate) return true;
      const assetDate = new Date(asset.acquisitionDate);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      if (start && assetDate < start) return false;
      if (end && assetDate > end) return false;
      return true;
    });
  }, [assets, startDate, endDate]);
  
  const downloadPDF = () => {
    const { jsPDF } = (window as any).jspdf;
    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.text("공원 자산 보고서", 14, 20);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`기간: ${startDate || '전체'} ~ ${endDate || '전체'}`, 14, 26);

    (doc as any).autoTable({
        startY: 32,
        head: [['자산명', '종류', '상태', '취득일자', '위도', '경도']],
        body: filteredAssets.map(asset => [
            asset.assetName,
            asset.assetType,
            asset.status,
            asset.acquisitionDate,
            asset.latitude?.toFixed(5) || 'N/A',
            asset.longitude?.toFixed(5) || 'N/A',
        ]),
        styles: { font: 'helvetica' },
        headStyles: { fillColor: [22, 160, 133] },
    });

    doc.save(`park_asset_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };
  
  const downloadCSV = () => {
      const Papa = (window as any).Papa;
      const csvData = filteredAssets.map(asset => ({
          '자산명': asset.assetName,
          '자산 종류': asset.assetType,
          '상태': asset.status,
          '설명': asset.description,
          '취득일자': asset.acquisitionDate,
          '사진 URL': asset.imageUrl,
          '위도': asset.latitude,
          '경도': asset.longitude
      }));
      const csv = Papa.unparse(csvData);
      const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `park_asset_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-gray-800">보고서 생성</h2>
      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="reportStartDate" className="block text-sm font-medium text-gray-700">시작일</label>
          <input
            type="date"
            id="reportStartDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="reportEndDate" className="block text-sm font-medium text-gray-700">종료일</label>
          <input
            type="date"
            id="reportEndDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      <div className="flex justify-end space-x-2 mb-6">
        <button onClick={downloadPDF} disabled={filteredAssets.length === 0} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-300">PDF 다운로드</button>
        <button onClick={downloadCSV} disabled={filteredAssets.length === 0} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300">CSV 다운로드</button>
      </div>

      <h3 className="text-lg font-medium text-gray-800 mb-2">보고서 미리보기</h3>
       <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-100">
            <tr>
              {['자산명', '종류', '상태', '취득일자', '사진'].map(header => (
                <th key={header} className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredAssets.length > 0 ? filteredAssets.map(asset => (
              <tr key={asset.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">{asset.assetName}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{asset.assetType}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{asset.status}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{asset.acquisitionDate}</td>
                <td className="px-4 py-3">
                  <img src={asset.imageUrl} alt={asset.assetName} className="w-12 h-12 object-cover rounded-md" />
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="text-center py-10 text-gray-500">선택된 기간에 해당하는 자산이 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default ReportGeneration;
