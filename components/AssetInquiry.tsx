
import React, { useState, useMemo } from 'react';
import { ParkAsset } from '../types';

interface AssetInquiryProps {
  assets: ParkAsset[];
}

const AssetInquiry: React.FC<AssetInquiryProps> = ({ assets }) => {
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const filteredAssets = useMemo(() => {
    if (!startDate && !endDate) return assets;
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

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">자산 조회</h2>
      
      <div className="bg-gray-50 p-4 rounded-md mb-6 flex flex-wrap items-end gap-4">
        <div className="flex-grow">
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">조회 시작일</label>
          <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} max={today} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-park-green-500 focus:border-park-green-500" />
        </div>
        <div className="flex-grow">
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">조회 종료일</label>
          <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} max={today} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-park-green-500 focus:border-park-green-500" />
        </div>
         <button onClick={clearFilters} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition h-10">
            필터 초기화
        </button>
      </div>

      <div className="overflow-x-auto">
        {filteredAssets.length > 0 ? (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">자산명</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">등록일시</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">현장사진</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">위치도</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">위도/경도</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAssets.map(asset => (
              <tr key={asset.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{asset.name}</div>
                  <div className="text-sm text-gray-500">{asset.type}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(asset.registrationDate).toLocaleString('ko-KR')}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <img src={asset.photo} alt={asset.name} className="h-16 w-16 object-cover rounded-md shadow-sm" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <img src={asset.mapView} alt="위치도" className="h-16 w-16 object-cover rounded-md shadow-sm" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>{asset.latitude?.toFixed(5)}</div>
                  <div>{asset.longitude?.toFixed(5)}</div>
                </td>
                 <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        asset.condition === '좋음' ? 'bg-green-100 text-green-800' :
                        asset.condition === '보통' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                    }`}>
                        {asset.condition}
                    </span>
                 </td>
              </tr>
            ))}
          </tbody>
        </table>
        ) : (
          <div className="text-center py-10 text-gray-500">
            <p>해당 기간에 등록된 자산이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetInquiry;
