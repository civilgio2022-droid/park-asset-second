import React, { useState, useMemo } from 'react';
import { ParkAsset } from '../types.ts';

interface AssetInquiryProps {
  assets: ParkAsset[];
  loading: boolean;
  onEdit: (asset: ParkAsset) => void;
  onDelete: (assetId: string, imageUrl: string) => void;
}

const AssetInquiry: React.FC<AssetInquiryProps> = ({ assets, loading, onEdit, onDelete }) => {
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

  if (loading) {
    return <div className="text-center p-8">데이터를 불러오는 중...</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-gray-800">자산 조회</h2>
      <div className="flex flex-wrap gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">시작일</label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">종료일</label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              {['자산명', '종류', '상태', '취득일자', '사진', '위도', '경도', '관리'].map(header => (
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
                  <img src={asset.imageUrl} alt={asset.assetName} className="w-16 h-16 object-cover rounded-md cursor-pointer" onClick={() => window.open(asset.imageUrl, '_blank')} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{asset.latitude?.toFixed(5) || 'N/A'}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{asset.longitude?.toFixed(5) || 'N/A'}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-2">
                   <button onClick={() => onEdit(asset)} className="text-blue-600 hover:text-blue-800">수정</button>
                   <button onClick={() => onDelete(asset.id, asset.imageUrl)} className="text-red-600 hover:text-red-800">삭제</button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={8} className="text-center py-10 text-gray-500">등록된 자산이 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AssetInquiry;
