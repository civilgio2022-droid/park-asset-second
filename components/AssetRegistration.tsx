import React, { useState, useEffect, useRef } from 'react';
import { ParkAsset } from '../types.ts';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

interface AssetRegistrationProps {
  onAddAsset: (asset: Omit<ParkAsset, 'id'>) => Promise<void>;
  onUpdateAsset: (asset: ParkAsset) => Promise<void>;
  storage: any; // Firebase Storage instance
  assetToEdit: ParkAsset | null;
  onCancelEdit: () => void;
}

const AssetRegistration: React.FC<AssetRegistrationProps> = ({ onAddAsset, onUpdateAsset, storage, assetToEdit, onCancelEdit }) => {
  const [formData, setFormData] = useState({
    assetName: '', assetType: '', status: '양호', description: '', acquisitionDate: '',
  });
  const [location, setLocation] = useState<{ lat: number | null; lon: number | null }>({ lat: null, lon: null });
  const [photo, setPhoto] = useState<string | null>(null); // data URL for preview
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (assetToEdit) {
      setFormData({
        assetName: assetToEdit.assetName,
        assetType: assetToEdit.assetType,
        status: assetToEdit.status,
        description: assetToEdit.description,
        acquisitionDate: assetToEdit.acquisitionDate,
      });
      setLocation({ lat: assetToEdit.latitude, lon: assetToEdit.longitude });
      setPhoto(assetToEdit.imageUrl);
      setPhotoFile(null); // Editing starts without a new file
    } else {
      // Reset form when not editing
      handleCancel();
    }
  }, [assetToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraOpen(true);
        // Get location while camera is opening
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation({
              lat: position.coords.latitude,
              lon: position.coords.longitude,
            });
          },
          (err) => {
            console.error("Error getting location: ", err);
            alert("위치 정보를 가져올 수 없습니다. 브라우저 설정을 확인해주세요.");
          },
          { enableHighAccuracy: true }
        );
      }
    } catch (err) {
      console.error("Error accessing camera: ", err);
      alert("카메라에 접근할 수 없습니다. 권한을 확인해주세요.");
    }
  };

  const takePicture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setPhoto(dataUrl);
      canvas.toBlob(blob => {
          if (blob) {
              setPhotoFile(new File([blob], `asset_${Date.now()}.jpg`, { type: 'image/jpeg' }));
          }
      }, 'image/jpeg', 0.95);
      closeCamera();
    }
  };
  
  const closeCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photo || !formData.acquisitionDate) {
        alert("현장사진과 취득일자는 필수입니다.");
        return;
    }
    setIsSubmitting(true);
    let imageUrl = assetToEdit?.imageUrl || ''; // Keep old image url unless new one is uploaded

    if (photoFile) { // A new photo was taken
        const imageRef = storageRef(storage, `assets/${Date.now()}_${photoFile.name}`);
        await uploadBytes(imageRef, photoFile);
        imageUrl = await getDownloadURL(imageRef);
    }

    const assetData = {
        ...formData,
        imageUrl,
        latitude: location.lat,
        longitude: location.lon,
    };
    
    try {
        if(assetToEdit) {
            await onUpdateAsset({ ...assetData, id: assetToEdit.id });
            alert('자산이 성공적으로 수정되었습니다.');
        } else {
            await onAddAsset(assetData);
            alert('자산이 성공적으로 등록되었습니다.');
        }
        handleCancel();
    } catch (error) {
        console.error("Error saving asset: ", error);
        alert("저장 중 오류가 발생했습니다.");
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleCancel = () => {
      setFormData({ assetName: '', assetType: '', status: '양호', description: '', acquisitionDate: '' });
      setLocation({ lat: null, lon: null });
      setPhoto(null);
      setPhotoFile(null);
      onCancelEdit();
  };

  const NaverStaticMap: React.FC<{ lat: number; lon: number }> = ({ lat, lon }) => {
    const naverClientId = 'YOUR_NAVER_CLIENT_ID'; // Replace with your Naver Maps Client ID
    if (!naverClientId || naverClientId === 'YOUR_NAVER_CLIENT_ID') {
        return <div className="text-center p-4 bg-yellow-100 rounded-md">네이버 지도 Client ID를 설정해주세요.</div>
    }
    const mapUrl = `https://naveropenapi.apigw.ntruss.com/map-static/v2/raster?w=400&h=300&center=${lon},${lat}&level=16&markers=type:t|size:mid|pos:${lon}%20${lat}|label:%EC%9E%90%EC%82%B0%20%EC%9C%84%EC%B9%98&X-NCP-APIGW-API-KEY-ID=${naverClientId}`;
    return <img src={mapUrl} alt="위치도" className="w-full h-auto rounded-lg border" />;
  };

  const renderInputField = (id: string, label: string, type = 'text', required = true) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
        <input
            type={type}
            id={id}
            name={id}
            value={formData[id as keyof typeof formData] || ''}
            onChange={handleChange}
            required={required}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
    </div>
  );

  return (
    <div>
        {isCameraOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50">
            <video ref={videoRef} autoPlay className="w-full max-w-lg h-auto"></video>
            <div className="mt-4 space-x-4">
                <button onClick={takePicture} className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700">촬영</button>
                <button onClick={closeCamera} className="px-6 py-3 bg-gray-600 text-white rounded-lg shadow-md hover:bg-gray-700">취소</button>
            </div>
            <canvas ref={canvasRef} className="hidden"></canvas>
        </div>
      )}
      <h2 className="text-xl font-semibold mb-4 text-gray-800">{assetToEdit ? '자산 수정' : '자산 등록'}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {renderInputField('assetName', '자산명')}
        {renderInputField('assetType', '자산 종류')}
        <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">상태</label>
            <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
                <option>양호</option>
                <option>수리 필요</option>
                <option>불량</option>
                <option>폐기 대상</option>
            </select>
        </div>
        <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">설명</label>
            <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
        </div>
        {renderInputField('acquisitionDate', '취득일자', 'date')}
        
        <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700">현장사진</h3>
            <button type="button" onClick={openCamera} className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">사진 촬영</button>
            {photo && <img src={photo} alt="현장사진" className="mt-2 w-full h-auto rounded-lg border" />}
        </div>
        
        <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700">위치도 및 좌표</h3>
            {location.lat && location.lon ? (
                 <>
                    <NaverStaticMap lat={location.lat} lon={location.lon} />
                    <div className="grid grid-cols-2 gap-4 mt-2">
                        {renderInputField('latitude', '위도', 'number')}
                        {renderInputField('longitude', '경도', 'number')}
                    </div>
                 </>
            ) : <p className="text-gray-500 text-sm">사진 촬영 시 위치 정보가 자동으로 등록됩니다.</p>}
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          {assetToEdit && <button type="button" onClick={handleCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">취소</button>}
          <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300">
            {isSubmitting ? '저장 중...' : (assetToEdit ? '수정 완료' : '등록하기')}
          </button>
        </div>
      </form>
    </div>
  );
};
export default AssetRegistration;
