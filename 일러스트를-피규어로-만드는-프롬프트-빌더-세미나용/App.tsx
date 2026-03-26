
import React, { useState, useCallback, useRef } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import {
  OptionsState,
  AspectRatioMode,
  FigurineStyle,
  Material,
} from './types';
import {
  AspectRatioIcon, ImageIcon,
  AssembleIcon, LightbulbIcon, DownloadIcon, CopyIcon,
  UploadIcon, GenerateIcon, CodeIcon,
  PaletteIcon, LayersIcon
} from './constants';
import SectionCard from './components/SectionCard';
import RadioInput from './components/RadioInput';
import CodeOutput from './components/CodeOutput';
import { 
  ASPECT_RATIOS
} from './constants';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const initialState: OptionsState = {
  aspectRatioMode: AspectRatioMode.MATCH,
  selectedAspectRatio: '1:1',
  style: FigurineStyle.STANDARD,
  material: Material.PVC,
};

interface ImageUploaderProps {
  image: string | null;
  onImageChange: (file: File) => void;
  title: string;
  description: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ image, onImageChange, title, description }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleAreaClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageChange(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
        onImageChange(file);
    }
  };

  const inputId = `file-upload-${title.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">{title}</label>
      <div
        className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md cursor-pointer transition-colors ${isDragging ? 'border-sky-500 bg-slate-700/50' : 'border-slate-600 hover:border-sky-500'}`}
        onClick={handleAreaClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="space-y-1 text-center pointer-events-none">
          {image ? (
            <img src={image} alt="Preview" className="mx-auto h-48 w-auto rounded-lg object-contain" />
          ) : (
            <>
              <UploadIcon />
              <div className="flex text-sm text-slate-400">
                <p className="pl-1">{description}</p>
              </div>
            </>
          )}
          <input ref={fileInputRef} id={inputId} name={inputId} type="file" className="sr-only" onChange={handleFileInputChange} accept="image/*" />
        </div>
      </div>
    </div>
  );
};

interface PromptOutputProps {
  title: string;
  prompt: string;
  onCopy: (text: string) => void;
  onGenerate: (prompt: string) => void;
  isGenerating: boolean;
}

const PromptOutput: React.FC<PromptOutputProps> = ({ title, prompt, onCopy, onGenerate, isGenerating }) => {
  const rowCount = prompt.split('\n').length;
  return (
    <div>
      <h4 className="text-md font-semibold text-slate-200 mb-2">{title}</h4>
      <div className="relative">
        <textarea
          readOnly
          value={prompt}
          rows={Math.max(3, Math.min(15, rowCount))}
          className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 pr-28 text-slate-300 font-mono text-sm whitespace-pre-wrap"
        />
        <div className="absolute top-2 right-2 flex gap-2">
            <button 
                onClick={() => onCopy(prompt)} 
                title="프롬프트 복사" 
                className="p-2 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
            >
              <CopyIcon />
            </button>
            <button 
                onClick={() => onGenerate(prompt)} 
                title="이미지 생성"
                disabled={isGenerating}
                className="p-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors"
            >
              <GenerateIcon /> 
            </button>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [options, setOptions] = useState<OptionsState>(initialState);
  const [mainImage, setMainImage] = useState<string | null>(null);
  const [subjectPrompt, setSubjectPrompt] = useState('a character');
  const [assembledPrompt, setAssembledPrompt] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [activeTab, setActiveTab] = useState<'prompt' | 'code'>('prompt');
  const [copySuccess, setCopySuccess] = useState('');
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const handleOptionsChange = useCallback(<K extends keyof OptionsState,>(key: K, value: OptionsState[K]) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleMainImageSelected = (file: File) => {
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = async (event) => {
            const base64Image = event.target?.result as string;
            setMainImage(base64Image);
            
            setIsGeneratingDescription(true);
            setSubjectPrompt('');
            
            try {
                const base64Data = base64Image.split(',')[1];
                const imagePart = {
                    inlineData: {
                        mimeType: file.type,
                        data: base64Data,
                    },
                };
                const textPart = {
                    text: "Analyze the main subject in this image and provide a concise, descriptive prompt in English for an image generation AI, focusing on key visual characteristics. For example: 'a girl with pink hair', 'a cute white cat', 'a powerful red robot'. The description should be a short phrase, not a full sentence. Do not add any extra text, quotation marks, or pleasantries, just the description.",
                };
                
                const response = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: { parts: [imagePart, textPart] },
                });
                
                setSubjectPrompt(response.text.trim());
            } catch (error) {
                console.error("Error generating subject description:", error);
                setSubjectPrompt("이미지 분석에 실패했습니다. 직접 설명을 입력해주세요.");
            } finally {
                setIsGeneratingDescription(false);
            }
        };
        reader.readAsDataURL(file);
    }
  };
    
  const handleAssemblePrompt = useCallback(() => {
    setAssembledPrompt('');
    
    const subject = subjectPrompt.trim() || 'a character';
    const negativePrompt = "Negative prompt: (worst quality, low quality, normal quality, signature, watermark, username, bad anatomy, bad hands, deformed limbs, blurry, pixelated, jpeg artifacts)";

    let promptParts: string[] = [];
    
    promptParts.push(`(Masterpiece, best quality, hires)`);
    
    if (options.aspectRatioMode === AspectRatioMode.CHANGE) {
        promptParts.push(`(${options.selectedAspectRatio} aspect ratio)`);
    }
    
    let stylePrefix = '';
    switch (options.style) {
        case FigurineStyle.CHIBI:
            stylePrefix = 'cute chibi style';
            break;
        case FigurineStyle.ACTION_FIGURE:
            stylePrefix = 'poseable action figure';
            break;
        case FigurineStyle.VINTAGE_TOY:
            stylePrefix = 'vintage retro toy';
            break;
        default:
            stylePrefix = 'photorealistic collectible';
    }

    const materialName = options.material.toLowerCase();
    const figurePrompt = `${stylePrefix} ${materialName} figurine of ${subject}, full body, highly detailed sculpt, realistic painted surface with detailed shading, glossy highlights on hair and clothing, matte finish on skin, subtle seam lines`;
    promptParts.push(figurePrompt);

    promptParts.push('placed on a simple acrylic base');
    promptParts.push('professional studio lighting', 'clean seamless background', 'realistic product photography');
    promptParts.push('ultra high resolution');

    const mainPrompt = promptParts.join(', ');
    const finalPrompt = [mainPrompt, negativePrompt].join('\n\n');
    setAssembledPrompt(finalPrompt);

    const truncatedImage = mainImage ? `${mainImage.substring(0, 80)}... (truncated)` : 'YOUR_BASE64_IMAGE_DATA_HERE';
    const mimeType = mainImage?.match(/data:(.*);base64,/)?.[1] || 'image/png';
    const escapedPrompt = finalPrompt.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');

    const codeSnippet = `import { GoogleGenAI, Modality } from "@google/genai";

// Ensure your API key is set as an environment variable (e.g., process.env.API_KEY)
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

async function generateFigurineImage() {
  const base64ImageData = "${truncatedImage}";
  const mimeType = "${mimeType}";
  const prompt = \`${escapedPrompt}\`;

  const base64Data = base64ImageData.split(',')[1];
  const imagePart = {
    inlineData: { mimeType, data: base64Data },
  };
  const textPart = { text: prompt };

  try {
    console.log("Generating image...");
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    console.log("Response received.");
    
    let generatedImageFound = false;
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const { data, mimeType } = part.inlineData;
        const imageUrl = \`data:\${mimeType};base64,\${data}\`;
        console.log("Image generated! URL (truncated):", imageUrl.substring(0, 100) + "...");
        // You can now use this data URL to display the image.
        generatedImageFound = true;
        break;
      }
    }
    
    if (!generatedImageFound) {
      console.error("No image data found in response. Text response:", response.text);
    }
  } catch (error) {
    console.error("Error during image generation:", error);
  }
}

generateFigurineImage();
`;
    setGeneratedCode(codeSnippet);
    setActiveTab('prompt');

  }, [options, subjectPrompt, mainImage]);
    
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
        setCopySuccess('클립보드에 복사되었습니다.');
        setTimeout(() => setCopySuccess(''), 2000);
    }, (err) => {
        console.error('Could not copy text: ', err);
        setCopySuccess('복사에 실패했습니다.');
        setTimeout(() => setCopySuccess(''), 2000);
    });
  };

  const handleGenerateImage = useCallback(async (prompt: string) => {
    if (!mainImage) {
        setGenerationError("먼저 참조 이미지를 업로드해주세요.");
        setIsGeneratingImage(false);
        setGeneratedImage(null);
        return;
    }

    setIsGeneratingImage(true);
    setGeneratedImage(null);
    setGenerationError(null);

    try {
        const base64Data = mainImage.split(',')[1];
        const mimeType = mainImage.match(/data:(.*);base64,/)?.[1] || 'image/png';

        const imagePart = {
            inlineData: {
                mimeType: mimeType,
                data: base64Data,
            },
        };
        const textPart = {
            text: prompt,
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        let foundImage = false;
        if (response.candidates && response.candidates.length > 0) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    const base64ImageBytes: string = part.inlineData.data;
                    const imageMimeType = part.inlineData.mimeType;
                    const imageUrl = `data:${imageMimeType};base64,${base64ImageBytes}`;
                    setGeneratedImage(imageUrl);
                    foundImage = true;
                    break; 
                }
            }
        }

        if (!foundImage) {
            setGenerationError("모델이 이미지를 반환하지 않았습니다. 요청이 거부되었을 수 있습니다. 모델 응답: " + response.text);
        }

    } catch (error) {
        console.error("Error generating image:", error);
        setGenerationError("이미지 생성 중 오류가 발생했습니다. 자세한 내용은 콘솔을 확인하세요.");
    } finally {
        setIsGeneratingImage(false);
    }
  }, [mainImage]);

  const handleDownloadImage = useCallback(() => {
    if (!generatedImage) return;

    const a = document.createElement('a');
    a.href = generatedImage;
    const mimeType = generatedImage.match(/data:(.*);base64,/)?.[1] || 'image/png';
    const extension = mimeType.split('/')[1] || 'png';
    a.download = `generated-figurine.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [generatedImage]);


  return (
    <div className="min-h-screen text-slate-300 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center space-y-4 py-8 relative">
            <h1 className="text-3xl font-bold text-slate-100">일러스트를 피규어로 만드는 프롬프트 빌더</h1>
            <p className="text-slate-400">일러스트를 피규어로 만들기 위한 프롬프트를 조립하세요.</p>
        </header>

        <div className="space-y-6">
            <SectionCard title="참조 이미지" icon={<ImageIcon />}>
                <p className="text-sm text-slate-400 mb-4">
                    피규어로 만들고 싶은 캐릭터의 일러스트를 업로드합니다. 이 이미지를 기반으로 피사체 설명이 자동으로 생성됩니다.
                </p>
                <ImageUploader 
                    image={mainImage}
                    onImageChange={handleMainImageSelected}
                    title="일러스트 업로드"
                    description="파일을 끌어다 놓거나 클릭하여 업로드"
                />
                 <div className="mt-4">
                    <label htmlFor="subjectPrompt" className="block text-sm font-medium text-slate-300 mb-2">피사체 설명 (필수)</label>
                    <div className="relative mt-1">
                        <input
                          id="subjectPrompt"
                          type="text"
                          value={subjectPrompt}
                          onChange={e => setSubjectPrompt(e.target.value)}
                          placeholder={isGeneratingDescription ? "이미지 분석 중..." : "예: a girl with pink hair"}
                          className="block w-full bg-slate-800 border border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm pr-10"
                          disabled={isGeneratingDescription}
                        />
                        {isGeneratingDescription && (
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                 <svg className="animate-spin h-5 w-5 text-sky-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                            </div>
                        )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                        이미지를 업로드하면 자동으로 설명이 생성되며, 직접 수정할 수도 있습니다.
                    </p>
                </div>
            </SectionCard>

            <SectionCard title="피규어 스타일" icon={<PaletteIcon />}>
                <p className="text-sm text-slate-400 mb-4">피규어의 전반적인 스타일을 선택합니다.</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.values(FigurineStyle).map(s => (
                        <button
                            key={s}
                            onClick={() => handleOptionsChange('style', s)}
                            className={`py-2 px-3 rounded-md border text-sm transition-colors ${options.style === s ? 'bg-sky-600 border-sky-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-400'}`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </SectionCard>

            <SectionCard title="재질 설정" icon={<LayersIcon />}>
                <p className="text-sm text-slate-400 mb-4">피규어의 재질감을 설정합니다. 재질에 따라 빛 반사와 질감이 달라집니다.</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.values(Material).map(m => (
                        <button
                            key={m}
                            onClick={() => handleOptionsChange('material', m)}
                            className={`py-2 px-3 rounded-md border text-sm transition-colors ${options.material === m ? 'bg-sky-600 border-sky-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-400'}`}
                        >
                            {m}
                        </button>
                    ))}
                </div>
            </SectionCard>

            <SectionCard title="가로세로 비율" icon={<AspectRatioIcon />}>
                <p className="text-sm text-slate-400 mb-4">생성될 피규어 이미지의 가로세로 비율을 설정합니다. 참조 이미지의 비율을 따르거나 새로운 비율을 지정할 수 있습니다.</p>
                <div className="flex space-x-6">
                    <RadioInput name="aspectRatio" value={AspectRatioMode.MATCH} label="참조 이미지 비율에 맞춤" checked={options.aspectRatioMode === AspectRatioMode.MATCH} onChange={v => handleOptionsChange('aspectRatioMode', v)} />
                    <RadioInput name="aspectRatio" value={AspectRatioMode.CHANGE} label="가로세로 비율 변경" checked={options.aspectRatioMode === AspectRatioMode.CHANGE} onChange={v => handleOptionsChange('aspectRatioMode', v)} />
                </div>
                {options.aspectRatioMode === AspectRatioMode.CHANGE && (
                   <div className="pt-4 space-y-4">
                        <p className="text-sm text-slate-400">
                            생성할 이미지의 가로세로 비율을 선택하세요.
                        </p>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                            {ASPECT_RATIOS.map(ar => (
                                <button
                                    key={ar.label}
                                    onClick={() => handleOptionsChange('selectedAspectRatio', ar.label)}
                                    className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 ${options.selectedAspectRatio === ar.label ? 'border-sky-500 bg-sky-900/30' : 'border-slate-600 hover:border-sky-500 bg-slate-700/50'}`}
                                    aria-label={`Aspect ratio ${ar.label}`}
                                    aria-pressed={options.selectedAspectRatio === ar.label}
                                >
                                    <div className="w-14 h-14 flex items-center justify-center mb-2 bg-slate-800/50 rounded-md">
                                        <div
                                            className={`rounded-sm transition-colors ${options.selectedAspectRatio === ar.label ? 'bg-sky-400' : 'bg-slate-500'}`}
                                            style={{ width: `${ar.w * 0.4}px`, height: `${ar.h * 0.4}px` }}
                                        ></div>
                                    </div>
                                    <div className="text-center">
                                        <span className={`text-sm font-medium ${options.selectedAspectRatio === ar.label ? 'text-sky-400' : 'text-slate-300'}`}>{ar.label}</span>
                                        <span className="block text-xs text-slate-400">{ar.description.replace(/[()]/g, '')}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </SectionCard>

            <SectionCard title="프롬프트 조립" icon={<AssembleIcon />}>
                <p className="text-sm text-slate-400 mb-4">설정한 옵션에 따라 프롬프트를 생성합니다. 생성된 프롬프트를 복사하여 이미지 생성 AI에 사용하세요.</p>
                <button
                    onClick={handleAssemblePrompt}
                    className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    <AssembleIcon />
                    프롬프트 조립
                </button>
                {copySuccess && <p className="text-green-400 text-sm mt-2 text-center">{copySuccess}</p>}
                
                {assembledPrompt && (
                  <div className="mt-6">
                    <div className="border-b border-slate-600 mb-4">
                      <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        <button onClick={() => setActiveTab('prompt')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${activeTab === 'prompt' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-400'}`}>
                          <LightbulbIcon /> Prompt
                        </button>
                        <button onClick={() => setActiveTab('code')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${activeTab === 'code' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-400'}`}>
                          <CodeIcon /> Code
                        </button>
                      </nav>
                    </div>
                    {activeTab === 'prompt' && (
                      <PromptOutput title="생성된 프롬프트" prompt={assembledPrompt} onCopy={copyToClipboard} onGenerate={handleGenerateImage} isGenerating={isGeneratingImage} />
                    )}
                    {activeTab === 'code' && (
                      <CodeOutput language="javascript" code={generatedCode} onCopy={copyToClipboard} />
                    )}
                  </div>
                )}
            </SectionCard>

            {(isGeneratingImage || generatedImage || generationError) && (
                <SectionCard title="생성된 이미지" icon={<GenerateIcon />}>
                    {isGeneratingImage && (
                        <div className="flex flex-col items-center justify-center gap-4 p-8">
                            <div className="w-10 h-10 border-4 border-slate-500 border-t-sky-400 rounded-full animate-spin"></div>
                            <p className="text-slate-400">이미지를 생성하는 중입니다...</p>
                        </div>
                    )}
                    {generationError && (
                        <div className="bg-red-900/50 border border-red-500/50 text-red-300 p-4 rounded-lg">
                            <p className="font-bold">생성 실패</p>
                            <p className="text-sm mt-1">{generationError}</p>
                        </div>
                    )}
                    {generatedImage && (
                        <div className="flex flex-col items-center gap-4">
                            <img src={generatedImage} alt="Generated figurine" className="max-w-full h-auto rounded-lg shadow-lg" />
                            <button
                                onClick={handleDownloadImage}
                                className="flex items-center gap-2 text-sm bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition-colors"
                            >
                                <DownloadIcon />
                                다운로드
                            </button>
                        </div>
                    )}
                </SectionCard>
            )}
        </div>
        <footer className="text-center text-slate-500 text-sm py-4">
        </footer>
      </div>
    </div>
  );
};

export default App;
