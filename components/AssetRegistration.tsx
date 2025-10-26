
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ParkAsset } from '../types';

interface CameraModalProps {
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mediaStream: MediaStream;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
      .then(s => {
        setStream(s);
        mediaStream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      })
      .catch(err => {
        console.error("Camera access error:", err);
        setError("카메라에 접근할 수 없습니다. 권한을 확인해주세요.");
      });

    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        onCapture(dataUrl);
      }
    }
  }, [onCapture]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="p-4 border-b">
          <h3 className="text-lg font-medium">사진 촬영</h3>
        </div>
        <div className="p-4">
          {error ? (
            <div className="text-red-500 bg-red-100 p-4 rounded-md">{error}</div>
          ) : (
            <div className="relative">
              <video ref={videoRef} autoPlay playsInline className="w-full h-auto rounded-md bg-gray-900"></video>
              <canvas ref={canvasRef} className="hidden"></canvas>
            </div>
          )}
        </div>
        <div className="p-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition">취소</button>
          <button onClick={handleCapture} disabled={!stream} className="px-4 py-2 bg-park-green-600 text-white rounded-md hover:bg-park-green-700 disabled:bg-park-green-300 transition">촬영</button>
        </div>
      </div>
    </div>
  );
};


interface AssetRegistrationProps {
  onAddAsset: (asset: Omit<ParkAsset, 'id'>) => void;
  onComplete: () => void;
}

const AssetRegistration: React.FC<AssetRegistrationProps> = ({ onAddAsset, onComplete }) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: '벤치',
    photo: '',
    latitude: null as number | null,
    longitude: null as number | null,
    condition: '좋음' as '좋음' | '보통' | '나쁨',
    description: ''
  });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof formData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTakePhoto = () => {
    setIsSubmitting(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }));
        setIsCameraOpen(true);
        setIsSubmitting(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("위치 정보를 가져올 수 없습니다. GPS 권한을 확인해주세요.");
        setIsSubmitting(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleCapture = (dataUrl: string) => {
    setFormData(prev => ({ ...prev, photo: dataUrl }));
    setIsCameraOpen(false);
  };

  const validate = () => {
    const newErrors: Partial<Record<keyof typeof formData, string>> = {};
    if (!formData.name.trim()) newErrors.name = "자산명을 입력해주세요.";
    if (!formData.description.trim()) newErrors.description = "설명을 입력해주세요.";
    if (!formData.photo) newErrors.photo = "현장사진을 촬영해주세요.";
    if (formData.latitude === null || formData.longitude === null) {
      newErrors.latitude = "위치 정보가 없습니다.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      const newAsset: Omit<ParkAsset, 'id'> = {
        ...formData,
        registrationDate: new Date().toISOString(),
        mapView: `https://picsum.photos/seed/${formData.latitude},${formData.longitude}/400/300`, // Placeholder map view
      };
      onAddAsset(newAsset);
      alert('자산이 성공적으로 등록되었습니다.');
      onComplete();
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
      {isCameraOpen && <CameraModal onCapture={handleCapture} onClose={() => setIsCameraOpen(false)} />}
      <form onSubmit={handleSubmit} noValidate>
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">신규 자산 등록</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">자산명</label>
              <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className={`w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-park-green-500 focus:border-park-green-500`} />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">자산 종류</label>
              <select id="type" name="type" value={formData.type} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-park-green-500 focus:border-park-green-500">
                <option>벤치</option>
                <option>가로등</option>
                <option>분수대</option>
                <option>운동기구</option>
                <option>안내판</option>
              </select>
            </div>
            <div>
              <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1">상태</label>
              <select id="condition" name="condition" value={formData.condition} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-park-green-500 focus:border-park-green-500">
                <option>좋음</option>
                <option>보통</option>
                <option>나쁨</option>
              </select>
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">설명</label>
              <textarea id="description" name="description" rows={4} value={formData.description} onChange={handleChange} required className={`w-full px-3 py-2 border ${errors.description ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-park-green-500 focus:border-park-green-500`}></textarea>
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
            </div>
          </div>
          {/* Right Column */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">현장사진</label>
              <div className="w-full h-48 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center bg-gray-50">
                {formData.photo ? <img src={formData.photo} alt="현장사진" className="max-h-full max-w-full object-contain" /> : <span className="text-gray-500">사진 없음</span>}
              </div>
              <button type="button" onClick={handleTakePhoto} disabled={isSubmitting} className="mt-2 w-full flex justify-center items-center px-4 py-2 bg-park-green-600 text-white rounded-md hover:bg-park-green-700 disabled:bg-gray-400 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h1.172a2 2 0 011.414.586l.828.828A2 2 0 008.828 6H12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm8 3a3 3 0 100 6 3 3 0 000-6z" /></svg>
                {isSubmitting ? '위치 정보 확인 중...' : '사진 촬영'}
              </button>
              {errors.photo && <p className="text-red-500 text-xs mt-1">{errors.photo}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">위치도 (1:1000 평면도)</label>
              <div className="w-full h-48 border border-gray-300 rounded-md flex items-center justify-center bg-gray-50">
                 {formData.latitude ? <img src={`https://picsum.photos/seed/${formData.latitude},${formData.longitude}/400/300`} alt="위치도" className="max-h-full max-w-full object-cover" /> : <span className="text-gray-500">위치 정보 필요</span>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-1">위도</label>
                <input type="text" id="latitude" readOnly value={formData.latitude ?? ''} className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-1">경도</label>
                <input type="text" id="longitude" readOnly value={formData.longitude ?? ''} className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md" />
              </div>
               {errors.latitude && <p className="text-red-500 text-xs mt-1 col-span-2">{errors.latitude}</p>}
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t">
          <button type="submit" className="w-full md:w-auto float-right px-6 py-3 bg-park-green-700 text-white font-bold rounded-md hover:bg-park-green-800 transition shadow-lg">자산 등록 완료</button>
        </div>
      </form>
    </div>
  );
};

export default AssetRegistration;
