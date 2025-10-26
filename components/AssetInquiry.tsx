// Fix: Add missing imports for React and ParkAsset type.
import React from 'react';
import { ParkAsset } from '../types';

interface AssetInquiryProps {
  assets: ParkAsset[];
  onEdit: (asset: ParkAsset) => void;
  onDelete: (assetId: string) => void;
}

const AssetInquiry = ({ assets, onEdit, onDelete }: AssetInquiryProps) => {
  const [filter, setFilter] = React.useState({ year: '', month: '', day: '' });
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter({ ...filter, [e.target.name]: e.target.value });
  };
  
  const filteredAssets = assets.filter(asset => {
    if (!asset.registrationDate) return false;
    const date = new Date(asset.registrationDate);
    if (filter.year && date.getFullYear() !== parseInt(filter.year, 10)) return false;
    if (filter.month && (date.getMonth() + 1) !== parseInt(filter.month, 10)) return false;
    if (filter.day && date.getDate() !== parseInt(filter.day, 10)) return false;
    return true;
  });

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 text-gray-700">자산 조회</h2>
      <div className="flex flex-wrap justify-center items-center gap-2 mb-6 p-4 bg-gray-50 rounded-lg">
        <input type="number" name="year" placeholder="년(YYYY)" onChange={handleFilterChange} className="p-2 border rounded-md w-28"/>
        <input type="number" name="month" placeholder="월" onChange={handleFilterChange} className="p-2 border rounded-md w-24"/>
        <input type="number" name="day" placeholder="일" onChange={handleFilterChange} className="p-2 border rounded-md w-24"/>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full table-auto border-collapse text-left">
          <thead className="bg-gray-200 text-gray-600 uppercase text-sm">
            <tr>
              <th className="p-3">자산명</th>
              <th className="p-3">등록일시</th>
              <th className="p-3">현장사진</th>
              <th className="p-3">위치도</th>
              <th className="p-3">좌표</th>
              <th className="p-3">관리</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {filteredAssets.map(asset => (
              <tr key={asset.id} className="border-b hover:bg-gray-50">
                <td className="p-3 font-semibold">{asset.assetName}</td>
                <td className="p-3">{new Date(asset.registrationDate).toLocaleString()}</td>
                <td className="p-3"><img src={asset.photoURL} alt={asset.assetName} className="h-20 w-20 object-cover rounded-md"/></td>
                <td className="p-3"><img src={asset.mapURL} alt="위치도" className="h-20 w-20 object-cover rounded-md"/></td>
                <td className="p-3 text-xs">위도: {asset.latitude?.toFixed(4)}<br/>경도: {asset.longitude?.toFixed(4)}</td>
                <td className="p-3">
                  <button onClick={() => onEdit(asset)} className="bg-yellow-500 text-white px-3 py-1 rounded-md mr-2 hover:bg-yellow-600 text-sm">수정</button>
                  <button onClick={() => onDelete(asset.id)} className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 text-sm">삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
         {filteredAssets.length === 0 && <p className="text-center p-4">표시할 자산이 없습니다.</p>}
      </div>
    </div>
  );
};

// Fix: Export the AssetInquiry component so it can be imported in App.tsx.
export default AssetInquiry;
