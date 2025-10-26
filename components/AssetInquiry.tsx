// FIX: 'React' refers to a UMD global, but the current file is a module. Consider adding an import instead.
import React, { useState, useMemo } from 'react';
import { ParkAsset } from '../types.ts';

interface AssetInquiryProps {
    assets: ParkAsset[];
    onEdit: (asset: ParkAsset) => void;
    onDelete: (id: string) => void;
    loading: boolean;
}

function AssetInquiry({ assets, onEdit, onDelete, loading }: AssetInquiryProps) {
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
    
    if (loading) {
        return <div className="text-center p-8">데이터를 불러오는 중입니다...</div>
    }

    return (
        <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="font-semibold text-lg mb-3">기간 필터</h3>
                <div className="flex flex-wrap items-center gap-4">
                    <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
                    <span>~</span>
                    <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
                    <button onClick={() => { setFilterStartDate(''); setFilterEndDate(''); }} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">초기화</button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border">
                    <thead className="bg-gray-200">
                        <tr>
                            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">자산명</th>
                            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">등록일</th>
                            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">사진</th>
                            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">위치</th>
                            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAssets.length > 0 ? filteredAssets.map(asset => (
                            <tr key={asset.id} className="border-b hover:bg-gray-50">
                                <td className="py-3 px-4 align-top">{asset.name} ({asset.type})</td>
                                <td className="py-3 px-4 align-top">{new Date(asset.registrationDate).toLocaleDateString()}</td>
                                <td className="py-3 px-4 align-top">
                                    <a href={asset.photoUrl} target="_blank" rel="noopener noreferrer">
                                        <img src={asset.photoUrl} alt={asset.name} className="h-16 w-16 object-cover rounded-md shadow-sm"/>
                                    </a>
                                </td>
                                <td className="py-3 px-4 text-xs text-gray-600 align-top">
                                    <p>위도: {asset.latitude.toFixed(5)}</p>
                                    <p>경도: {asset.longitude.toFixed(5)}</p>
                                </td>
                                <td className="py-3 px-4 align-top">
                                    <div className="flex gap-2">
                                        <button onClick={() => onEdit(asset)} className="px-3 py-1 bg-yellow-500 text-white text-sm rounded-md hover:bg-yellow-600">수정</button>
                                        <button onClick={() => window.confirm('정말로 이 자산을 삭제하시겠습니까?') && onDelete(asset.id)} className="px-3 py-1 bg-red-500 text-white text-sm rounded-md hover:bg-red-600">삭제</button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                           <tr>
                                <td colSpan={5} className="text-center py-10 text-gray-500">등록된 자산이 없습니다.</td>
                           </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default AssetInquiry;
