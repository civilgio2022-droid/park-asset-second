// FIX: 'React' refers to a UMD global, but the current file is a module. Consider adding an import instead.
import React, { useState, useMemo } from 'react';
import { ParkAsset } from '../types.ts';
// FIX: Property 'jsPDF' does not exist on type '{}'. Import jsPDF and jspdf-autotable.
import jsPDF from 'jspdf';
import 'jspdf-autotable';
// FIX: Cannot find name 'Papa'. Import papaparse.
import Papa from 'papaparse';


interface ReportGenerationProps {
    assets: ParkAsset[];
}

function ReportGeneration({ assets }: ReportGenerationProps) {
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');

    const filteredAssets = useMemo(() => {
        return assets.filter(asset => {
            const regDate = new Date(asset.registrationDate);
            const start = filterStartDate ? new Date(filterStartDate) : null;
            const end = filterEndDate ? new Date(filterEndDate) : null;
            
            if(start) start.setHours(0,0,0,0);
            if(end) end.setHours(23,59,59,999);

            if (start && regDate < start) return false;
            if (end && regDate > end) return false;
            
            return true;
        });
    }, [assets, filterStartDate, filterEndDate]);
    
    const downloadPDF = () => {
        const doc = new jsPDF();
        
        doc.text("공원 자산 보고서", 14, 16);
        doc.setFontSize(10);
        doc.text(`기간: ${filterStartDate || '전체'} ~ ${filterEndDate || '전체'}`, 14, 22);

        const tableColumn = ["자산명", "종류", "상태", "등록일", "위치(위도,경도)"];
        const tableRows: (string|number)[][] = [];

        filteredAssets.forEach(asset => {
            const assetData = [
                asset.name,
                asset.type,
                asset.status,
                new Date(asset.registrationDate).toLocaleDateString(),
                `${asset.latitude.toFixed(5)}, ${asset.longitude.toFixed(5)}`
            ];
            tableRows.push(assetData);
        });

        // FIX: The autoTable method is added by a plugin and may not be recognized by TypeScript.
        (doc as any).autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 30,
        });
        
        doc.save(`park_asset_report_${new Date().toISOString().split('T')[0]}.pdf`);
    };
    
    const downloadCSV = () => {
        const csvData = filteredAssets.map(asset => ({
            '자산명': asset.name,
            '자산 종류': asset.type,
            '상태': asset.status,
            '설명': asset.description,
            '사진 URL': asset.photoUrl,
            '지도 URL': asset.mapUrl,
            '위도': asset.latitude,
            '경도': asset.longitude,
            '등록일시': asset.registrationDate,
        }));
        
        const csv = Papa.unparse(csvData);
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `park_asset_report_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="font-semibold text-lg mb-3">보고서 기간 선택</h3>
                <div className="flex flex-wrap items-center gap-4">
                    <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
                    <span>~</span>
                    <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
                </div>
            </div>

            <div className="p-4 border rounded-lg">
                <h3 className="font-semibold text-lg mb-3">보고서 미리보기 ({filteredAssets.length}개 자산)</h3>
                <div className="max-h-60 overflow-y-auto text-sm">
                    <ul>
                        {filteredAssets.map(asset => (
                            <li key={asset.id} className="py-1 border-b">{asset.name} - {new Date(asset.registrationDate).toLocaleDateString()}</li>
                        ))}
                    </ul>
                </div>
            </div>
            
            <div className="flex justify-end gap-4 pt-4">
                <button onClick={downloadPDF} disabled={filteredAssets.length === 0} className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-300">PDF 다운로드</button>
                <button onClick={downloadCSV} disabled={filteredAssets.length === 0} className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300">CSV 다운로드</button>
            </div>
        </div>
    );
}

export default ReportGeneration;
