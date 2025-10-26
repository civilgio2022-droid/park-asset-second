import React from 'react';
import { ParkAsset } from '../types';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';

interface ReportGenerationProps {
  assets: ParkAsset[];
}

export const ReportGeneration = ({ assets }: ReportGenerationProps) => {
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');

  const getFilteredAssets = () => {
    if (!startDate || !endDate) return assets;
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return assets.filter(asset => {
      if (!asset.registrationDate) return false;
      const assetDate = new Date(asset.registrationDate);
      return assetDate >= start && assetDate <= end;
    });
  };
  
  const handlePdfDownload = () => {
    // FIX: Use imported jsPDF instead of a global from window.
    const doc = new jsPDF();
    const tableData = getFilteredAssets().map(asset => [
      asset.assetName,
      asset.assetType,
      asset.status,
      new Date(asset.registrationDate).toLocaleDateString(),
      `${asset.latitude?.toFixed(4)}, ${asset.longitude?.toFixed(4)}`
    ]);

    // Add a font that supports Korean
    // For this example, we assume a font file is available, but in a real scenario, you'd need to provide one.
    // As a workaround for environments without custom fonts, we'll proceed without it, which may result in broken characters for Korean.
    doc.setFont("Helvetica", "normal"); 
    
    doc.text("공원 자산 보고서", 14, 20);
    (doc as any).autoTable({
        head: [['자산명', '종류', '상태', '등록일', '좌표']],
        body: tableData,
        startY: 30,
        // Add font style for the table to support Korean if possible
        // styles: { font: "YourKoreanFontName" } 
    });
    doc.save('park_asset_report.pdf');
  };
  
  const handleCsvDownload = () => {
    const csvData = getFilteredAssets().map(asset => ({
        '자산명': asset.assetName,
        '종류': asset.assetType,
        '상태': asset.status,
        '설명': asset.description,
        '등록일시': asset.registrationDate,
        '위도': asset.latitude,
        '경도': asset.longitude,
        '사진URL': asset.photoURL,
        '지도URL': asset.mapURL,
    }));
    
    const csv = Papa.unparse(csvData);
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "park_asset_report.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  const filtered = getFilteredAssets();

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 text-gray-700">보고서 생성</h2>
      <div className="flex flex-wrap justify-center items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 border rounded-md"/>
        <span>~</span>
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 border rounded-md"/>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(asset => (
          <div key={asset.id} className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-bold text-lg text-gray-800">{asset.assetName}</h3>
            <p className="text-sm text-gray-600">종류: {asset.assetType}</p>
            <p className="text-sm text-gray-600">상태: {asset.status}</p>
            <p className="text-sm text-gray-500">등록일: {new Date(asset.registrationDate).toLocaleDateString()}</p>
          </div>
        ))}
         {filtered.length === 0 && <p className="text-center p-4 col-span-full">보고서에 포함될 자산이 없습니다. 기간을 확인해주세요.</p>}
      </div>
      
      <div className="mt-8 flex justify-center space-x-4">
        <button onClick={handlePdfDownload} disabled={filtered.length === 0} className="px-8 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:bg-gray-400">PDF로 다운로드</button>
        <button onClick={handleCsvDownload} disabled={filtered.length === 0} className="px-8 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:bg-gray-400">CSV로 다운로드</button>
      </div>
    </div>
  );
};
