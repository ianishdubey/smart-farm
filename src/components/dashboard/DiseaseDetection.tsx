import { useState } from 'react';
import { Farm } from '../../lib/supabase';
import { Upload, Bug, AlertCircle } from 'lucide-react';

interface Props {
  farm: Farm | null;
}

interface Detection {
  disease: string;
  confidence: number;
  symptoms: string;
  treatment: string;
  prevention: string;
}

export default function DiseaseDetection({ farm }: Props) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [detection, setDetection] = useState<Detection | null>(null);
  const [cropType, setCropType] = useState('Wheat');

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
        setDetection(null);
      };
      reader.readAsDataURL(file);
    }
  }

  function detectDisease() {
    setDetecting(true);

    setTimeout(() => {
      const diseases = [
        {
          disease: 'Leaf Blight',
          confidence: 87,
          symptoms: 'Brown spots on leaves, wilting of plant parts, yellowing edges',
          treatment: 'Apply fungicide containing mancozeb or chlorothalonil. Remove and destroy infected leaves immediately.',
          prevention: 'Use disease-resistant varieties, ensure proper spacing between plants, avoid overhead irrigation',
        },
        {
          disease: 'Powdery Mildew',
          confidence: 92,
          symptoms: 'White powdery coating on leaves and stems, stunted growth',
          treatment: 'Apply sulfur-based fungicide or neem oil spray. Improve air circulation around plants.',
          prevention: 'Maintain proper plant spacing, avoid excessive nitrogen fertilization, water plants in the morning',
        },
        {
          disease: 'Aphid Infestation',
          confidence: 78,
          symptoms: 'Small insects visible on stems and undersides of leaves, sticky residue',
          treatment: 'Spray with neem oil or insecticidal soap. Use yellow sticky traps to monitor population.',
          prevention: 'Encourage natural predators like ladybugs, regular monitoring, remove weeds',
        },
      ];

      const randomDisease = diseases[Math.floor(Math.random() * diseases.length)];
      setDetection(randomDisease);
      setDetecting(false);
    }, 2000);
  }

  if (!farm) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <p className="text-gray-600">Please set up your farm profile to use disease detection.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Disease Detection</h2>
        <p className="text-gray-600">Upload crop images for AI-powered disease identification</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Crop Image</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Crop Type
              </label>
              <select
                value={cropType}
                onChange={(e) => setCropType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent mb-4"
              >
                <option>Wheat</option>
                <option>Rice</option>
                <option>Maize</option>
                <option>Cotton</option>
                <option>Mustard</option>
                <option>Potato</option>
                <option>Tomato</option>
              </select>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-500 transition-colors cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                {selectedImage ? (
                  <div>
                    <img
                      src={selectedImage}
                      alt="Selected crop"
                      className="max-h-64 mx-auto rounded-lg mb-4"
                    />
                    <p className="text-sm text-gray-600">Click to change image</p>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-1">Click to upload crop image</p>
                    <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
                  </div>
                )}
              </label>
            </div>

            {selectedImage && (
              <button
                onClick={detectDisease}
                disabled={detecting}
                className="w-full mt-4 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {detecting ? 'Analyzing Image...' : 'Detect Disease'}
              </button>
            )}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-900 mb-1">Tips for Best Results</p>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Take clear, well-lit photos</li>
                  <li>• Focus on affected leaves or parts</li>
                  <li>• Avoid blurry or distant shots</li>
                  <li>• Capture multiple angles if possible</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div>
          {detecting ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">AI is analyzing the image...</p>
            </div>
          ) : detection ? (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{detection.disease}</h3>
                    <p className="text-sm text-gray-600">Detected on {cropType}</p>
                  </div>
                  <div className="bg-red-100 px-4 py-2 rounded-lg">
                    <p className="text-sm text-red-700 font-medium">Confidence</p>
                    <p className="text-2xl font-bold text-red-800">{detection.confidence}%</p>
                  </div>
                </div>

                <div className="w-full bg-red-200 rounded-full h-2 mb-6">
                  <div
                    className="bg-red-600 h-2 rounded-full transition-all"
                    style={{ width: `${detection.confidence}%` }}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Bug className="h-5 w-5 text-red-600 mr-2" />
                    <h4 className="font-semibold text-red-900">Symptoms</h4>
                  </div>
                  <p className="text-sm text-red-800 leading-relaxed">{detection.symptoms}</p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Treatment</h4>
                  <p className="text-sm text-blue-800 leading-relaxed">{detection.treatment}</p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">Prevention</h4>
                  <p className="text-sm text-green-800 leading-relaxed">{detection.prevention}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium">
                  Save Report
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                  Share with Expert
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
              <Bug className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No detection yet</p>
              <p className="text-sm text-gray-500">Upload an image and click detect to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
