// Fix: Add imports for React and the ParkAsset type.
import React from 'react';
import { ParkAsset } from '../types';

interface AssetRegistrationProps {
  assetToEdit: ParkAsset | null;
  onAssetUpdated: () => void;
}

const AssetRegistration = ({ assetToEdit, onAssetUpdated }: AssetRegistrationProps) => {
  const { database, storage } = window as any;
  const [formData, setFormData] = React.useState({
    assetName: '', assetType: '', status: 'good', description: ''
  });
  const [location, setLocation] = React.useState<{ lat: number | null, lon: number | null }>({ lat: null, lon: null });
  const [photo, setPhoto] = React.useState<File | Blob | null>(null);
  const [photoPreview, setPhotoPreview] = React.useState('');
  const [mapURL, setMapURL] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isCameraOpen, setIsCameraOpen] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    if (assetToEdit) {
      setFormData({
        assetName: assetToEdit.assetName,
        assetType: assetToEdit.assetType,
        status: assetToEdit.status,
        description: assetToEdit.description,
      });
      setLocation({ lat: assetToEdit.latitude, lon: assetToEdit.longitude });
      setPhotoPreview(assetToEdit.photoURL);
      setMapURL(assetToEdit.mapURL);
      setPhoto(null); // Clear photo file if editing
    } else {
      resetForm();
    }
  }, [assetToEdit]);

  const resetForm = () => {
    setFormData({ assetName: '', assetType: '', status: 'good', description: '' });
    setLocation({ lat: null, lon: null });
    setPhoto(null);
    setPhotoPreview('');
    setMapURL('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTakePhoto = () => {
    setIsCameraOpen(true);
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(err => console.error(err));
  };
  
  const handleCapture = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    canvas.toBlob(blob => {
        if (blob) {
            setPhoto(blob);
            setPhotoPreview(URL.createObjectURL(blob));
        }
    }, 'image/jpeg');
    
    const stream = videoRef.current.srcObject as MediaStream;
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    setIsCameraOpen(false);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lon: longitude });
        const naverMapURL = `https://naveropenapi.apigw.ntruss.com/map-static/v2/raster?w=400&h=400&center=${longitude},${latitude}&level=16&markers=type:t|size:mid|pos:${longitude} ${latitude}|label:현위치`;
        setMapURL(naverMapURL);
      },
      (error) => {
        console.error("Geolocation error: ", error);
        alert("위치 정보를 가져올 수 없습니다.");
      }
    );
  };
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.assetName || !formData.assetType || (!photo && !assetToEdit)) {
        alert('자산명, 자산종류, 현장사진은 필수 항목입니다.');
        return;
    }
    setIsLoading(true);

    let photoURL = assetToEdit ? assetToEdit.photoURL : '';

    if (photo) {
        const photoName = photo instanceof File ? photo.name : 'capture.jpg';
        const filePath = `assets/${new Date().toISOString()}_${photoName}`;
        const storageRef = storage.ref(filePath);
        const snapshot = await storageRef.put(photo);
        photoURL = await snapshot.ref.getDownloadURL();
    }

    const assetData = {
        ...formData,
        photoURL,
        mapURL,
        latitude: location.lat,
        longitude: location.lon,
        registrationDate: assetToEdit ? assetToEdit.registrationDate : new Date().toISOString(),
        lastModified: new Date().toISOString()
    };
    
    const dbRef = assetToEdit ? database.ref(`assets/${assetToEdit.id}`) : database.ref('assets').push();
    
    dbRef.set(assetData)
      .then(() => {
        alert(`자산이 성공적으로 ${assetToEdit ? '수정' : '등록'}되었습니다.`);
        resetForm();
        if(assetToEdit) onAssetUpdated();
      })
      .catch(error => {
        console.error("Error writing to database: ", error);
        alert("데이터베이스 저장에 실패했습니다.");
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <div>
       {isCameraOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50">
          <video ref={videoRef} autoPlay className="w-full max-w-lg h-auto rounded-lg"></video>
          <button onClick={handleCapture} className="mt-4 px-6 py-3 bg-green-500 text-white font-bold rounded-lg shadow-lg hover:bg-green-600">
            촬영하기
          </button>
        </div>
      )}

      <h2 className="text-3xl font-bold mb-6 text-gray-700">{assetToEdit ? '자산 수정' : '신규 자산 등록'}</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <input type="text" name="assetName" value={formData.assetName} onChange={handleInputChange} placeholder="자산명" className="p-3 border rounded-lg w-full" required />
          <input type="text" name="assetType" value={formData.assetType} onChange={handleInputChange} placeholder="자산 종류 (예: 벤치, 가로등)" className="p-3 border rounded-lg w-full" required />
        </div>
        <select name="status" value={formData.status} onChange={handleInputChange} className="p-3 border rounded-lg w-full">
          <option value="good">양호</option>
          <option value="fair">보통</option>
          <option value="poor">불량</option>
        </select>
        <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="상세 설명" rows={4} className="p-3 border rounded-lg w-full"></textarea>
        
        <div className="p-4 border-2 border-dashed rounded-lg text-center">
            <button type="button" onClick={handleTakePhoto} className="px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600">
                현장사진 촬영
            </button>
            {photoPreview && <img src={photoPreview} alt="현장사진 미리보기" className="mt-4 mx-auto h-48 w-auto rounded-lg shadow-md" />}
        </div>
        
        {mapURL && (
            <div className="p-4 border rounded-lg">
                <h3 className="font-bold mb-2">위치도</h3>
                <img src={mapURL} alt="위치도" className="w-full rounded-lg shadow-md" />
                <div className="mt-2 text-sm text-gray-600">
                    <p>위도: {location.lat}</p>
                    <p>경도: {location.lon}</p>
                </div>
            </div>
        )}
        
        <button type="submit" disabled={isLoading} className="w-full p-4 bg-green-600 text-white font-bold text-lg rounded-lg hover:bg-green-700 disabled:bg-gray-400">
          {isLoading ? '저장 중...' : (assetToEdit ? '수정 완료' : '자산 등록')}
        </button>
      </form>
    </div>
  );
};

// Fix: Add default export for the component.
export default AssetRegistration;
